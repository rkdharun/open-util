import { Action, ActionPanel, Clipboard, Form } from "@raycast/api";
import { useEffect, useMemo, useState } from "react";

type Language = "python" | "javascript" | "node-fetch" | "go" | "php" | "ruby" | "curl-verbose";

interface ParsedCurl {
  method: string;
  url: string;
  headers: Record<string, string>;
  data: string | null;
  isJson: boolean;
  isForm: boolean;
}

function parseCurl(curlStr: string): ParsedCurl {
  const tokens: string[] = [];
  let current = "";
  let inQuote: string | null = null;

  for (let i = 0; i < curlStr.length; i++) {
    const c = curlStr[i];
    if (inQuote) {
      if (c === "\\") {
        // Count consecutive backslashes to determine if this one is an escape
        let numBackslashes = 0;
        while (i < curlStr.length && curlStr[i] === "\\") { numBackslashes++; i++; }
        // Emit floor(n/2) literal backslashes
        current += "\\".repeat(Math.floor(numBackslashes / 2));
        // If odd number of backslashes, the next char is escaped — consume it literally
        if (numBackslashes % 2 === 1 && i < curlStr.length) {
          current += curlStr[i];
        } else {
          // Even backslashes — the next char may close the quote
          i--; // re-process the next character
        }
      } else if (c === inQuote) {
        inQuote = null;
      } else {
        current += c;
      }
    } else if (c === "'" || c === '"') {
      inQuote = c;
    } else if (c === " " || c === "\t" || c === "\n") {
      if (current) { tokens.push(current); current = ""; }
    } else if (c === "\\") {
      // Line continuation outside quotes — skip backslash + following newline
      if (curlStr[i + 1] === "\n" || curlStr[i + 1] === "\r") {
        i++;
      }
    } else {
      current += c;
    }
  }
  if (current) tokens.push(current);

  let method = "GET";
  let url = "";
  const headers: Record<string, string> = {};
  let data: string | null = null;

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t === "curl") continue;
    if (t === "-X" || t === "--request") method = tokens[++i]?.toUpperCase() || "GET";
    else if (t === "-H" || t === "--header") {
      const h = tokens[++i] || "";
      const idx = h.indexOf(":");
      if (idx > -1) headers[h.slice(0, idx).trim()] = h.slice(idx + 1).trim();
    } else if (t === "-d" || t === "--data" || t === "--data-raw" || t === "--data-ascii") {
      data = tokens[++i] || "";
      if (method === "GET") method = "POST";
    } else if (t === "--data-urlencode") {
      data = tokens[++i] || "";
      method = method === "GET" ? "POST" : method;
    } else if (!t.startsWith("-")) {
      url = url || t;
    }
  }

  const ct = headers["Content-Type"] || headers["content-type"] || "";
  const isJson = ct.includes("application/json") || (data ? isValidJson(data) : false);
  const isForm = ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data");

  return { method, url, headers, data, isJson, isForm };
}

function isValidJson(s: string): boolean {
  try { JSON.parse(s); return true; } catch { return false; }
}

function toPython(p: ParsedCurl): string {
  const lines = ["import requests", ""];
  const hStr = JSON.stringify(p.headers, null, 4);
  if (Object.keys(p.headers).length > 0) lines.push(`headers = ${hStr}`, "");

  const hArg = Object.keys(p.headers).length > 0 ? ", headers=headers" : "";

  if (p.data) {
    if (p.isJson) {
      lines.push(`json_data = ${p.data}`, "");
      lines.push(`response = requests.${p.method.toLowerCase()}(`);
      lines.push(`    "${p.url}"${hArg},`);
      lines.push(`    json=json_data`);
      lines.push(")", "");
    } else {
      lines.push(`data = ${JSON.stringify(p.data)}`, "");
      lines.push(`response = requests.${p.method.toLowerCase()}(`);
      lines.push(`    "${p.url}"${hArg},`);
      lines.push(`    data=data`);
      lines.push(")", "");
    }
  } else {
    lines.push(`response = requests.${p.method.toLowerCase()}("${p.url}"${hArg})`, "");
  }
  lines.push("print(response.status_code)", "print(response.json())");
  return lines.join("\n");
}

function toJavaScript(p: ParsedCurl): string {
  const lines: string[] = [];
  const opts: string[] = [`  method: '${p.method}'`];
  if (Object.keys(p.headers).length > 0) {
    opts.push(`  headers: ${JSON.stringify(p.headers, null, 4).replace(/\n/g, "\n  ")}`);
  }
  if (p.data) opts.push(`  body: ${p.isJson ? p.data : JSON.stringify(p.data)}`);

  lines.push(`fetch('${p.url}', {`);
  lines.push(opts.join(",\n") + "\n})");
  lines.push("  .then(res => res.json())");
  lines.push("  .then(data => console.log(data))");
  lines.push("  .catch(err => console.error(err));");
  return lines.join("\n");
}

function toNodeFetch(p: ParsedCurl): string {
  return `const fetch = require('node-fetch');\n\n${toJavaScript(p)}`;
}

function toGo(p: ParsedCurl): string {
  const imports = ['  "fmt"', '  "io"', '  "net/http"'];
  if (p.data) imports.push('  "strings"');

  const lines: string[] = [
    "package main",
    "",
    "import (",
    ...imports,
    ")",
    "",
    "func main() {",
  ];

  if (p.data) {
    lines.push(`  body := strings.NewReader(${JSON.stringify(p.data)})`);
    lines.push(`  req, err := http.NewRequest("${p.method}", "${p.url}", body)`);
  } else {
    lines.push(`  req, err := http.NewRequest("${p.method}", "${p.url}", nil)`);
  }

  lines.push("  if err != nil { panic(err) }");

  for (const [k, v] of Object.entries(p.headers)) {
    lines.push(`  req.Header.Set(${JSON.stringify(k)}, ${JSON.stringify(v)})`);
  }

  lines.push(
    "",
    "  client := &http.Client{}",
    "  resp, err := client.Do(req)",
    "  if err != nil { panic(err) }",
    "  defer resp.Body.Close()",
    "",
    "  b, _ := io.ReadAll(resp.Body)",
    '  fmt.Println(resp.StatusCode, string(b))',
    "}"
  );

  return lines.filter((l) => l !== "").join("\n");
}

function toPhp(p: ParsedCurl): string {
  const lines: string[] = ["<?php", "", "$ch = curl_init();", `curl_setopt($ch, CURLOPT_URL, "${p.url}");`, "curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);"];
  if (p.method !== "GET") lines.push(`curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "${p.method}");`);
  if (Object.keys(p.headers).length > 0) {
    lines.push("curl_setopt($ch, CURLOPT_HTTPHEADER, [");
    for (const [k, v] of Object.entries(p.headers)) lines.push(`  "${k}: ${v}",`);
    lines.push("]);");
  }
  if (p.data) lines.push(`curl_setopt($ch, CURLOPT_POSTFIELDS, ${JSON.stringify(p.data)});`);
  lines.push("", "$response = curl_exec($ch);", "curl_close($ch);", "echo $response;");
  return lines.join("\n");
}

function toRuby(p: ParsedCurl): string {
  const lines = ["require 'uri'", "require 'net/http'", "", `uri = URI('${p.url}')`, `http = Net::HTTP.new(uri.host, uri.port)`, "http.use_ssl = true if uri.scheme == 'https'", ""];
  lines.push(`request = Net::HTTP::${p.method.charAt(0) + p.method.slice(1).toLowerCase()}.new(uri)`);
  for (const [k, v] of Object.entries(p.headers)) lines.push(`request['${k}'] = '${v}'`);
  if (p.data) lines.push(`request.body = ${JSON.stringify(p.data)}`);
  lines.push("", "response = http.request(request)", "puts response.body");
  return lines.join("\n");
}

function toCurlVerbose(p: ParsedCurl): string {
  const parts = ["curl -v"];
  if (p.method !== "GET") parts.push(`  -X ${p.method}`);
  for (const [k, v] of Object.entries(p.headers)) parts.push(`  -H '${k}: ${v}'`);
  if (p.data) parts.push(`  -d '${p.data}'`);
  parts.push(`  '${p.url}'`);
  return parts.join(" \\\n");
}

export default function CurlToCode() {
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState<Language>("python");

  useEffect(() => {
    Clipboard.readText().then((t) => {
      if (t && t.trim().startsWith("curl ")) setInput(t.trim());
    });
  }, []);

  const output = useMemo(() => {
    if (!input.trim()) return "";
    try {
      const parsed = parseCurl(input);
      if (!parsed.url) return "Error: Could not find URL in cURL command";
      switch (language) {
        case "python": return toPython(parsed);
        case "javascript": return toJavaScript(parsed);
        case "node-fetch": return toNodeFetch(parsed);
        case "go": return toGo(parsed);
        case "php": return toPhp(parsed);
        case "ruby": return toRuby(parsed);
        case "curl-verbose": return toCurlVerbose(parsed);
      }
    } catch (e) {
      return `Error: ${e instanceof Error ? e.message : String(e)}`;
    }
  }, [input, language]);

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.CopyToClipboard title="Copy Code" content={output ?? ""} shortcut={{ modifiers: ["cmd"], key: "return" }} />
          <Action title="Clear" onAction={() => setInput("")} shortcut={{ modifiers: ["cmd"], key: "k" }} />
        </ActionPanel>
      }
    >
      <Form.Dropdown id="language" title="Target Language" value={language} onChange={(v) => setLanguage(v as Language)}>
        <Form.Dropdown.Item value="python" title="Python (requests)" />
        <Form.Dropdown.Item value="javascript" title="JavaScript (fetch)" />
        <Form.Dropdown.Item value="node-fetch" title="Node.js (node-fetch)" />
        <Form.Dropdown.Item value="go" title="Go (net/http)" />
        <Form.Dropdown.Item value="php" title="PHP (cURL)" />
        <Form.Dropdown.Item value="ruby" title="Ruby (Net::HTTP)" />
        <Form.Dropdown.Item value="curl-verbose" title="cURL (verbose)" />
      </Form.Dropdown>
      <Form.TextArea
        id="input"
        title="cURL Command"
        placeholder={`curl -X POST "https://api.example.com/v1/data" -H "Content-Type: application/json" -d '{"key":"value"}'`}
        value={input}
        onChange={setInput}
      />
      <Form.TextArea id="output" title="Generated Code" value={output ?? ""} onChange={() => undefined} />
    </Form>
  );
}
