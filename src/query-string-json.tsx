import { Action, ActionPanel, Clipboard, Form } from "@raycast/api";
import { useEffect, useMemo, useState } from "react";

type Mode = "qs-to-json" | "json-to-qs";

function queryStringToJson(qs: string): unknown {
  const clean = qs.trim().replace(/^\?/, "");
  const params = new URLSearchParams(clean);
  const result: Record<string, string | string[]> = {};

  params.forEach((value, key) => {
    if (key in result) {
      const existing = result[key];
      if (Array.isArray(existing)) existing.push(value);
      else result[key] = [existing, value];
    } else {
      result[key] = value;
    }
  });

  return result;
}

function jsonToQueryString(jsonStr: string): string {
  const obj = JSON.parse(jsonStr) as Record<string, unknown>;
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(obj)) {
    if (Array.isArray(value)) {
      for (const v of value) params.append(key, String(v));
    } else if (value !== null && value !== undefined) {
      params.set(key, String(value));
    }
  }

  return params.toString();
}

export default function QueryStringJson() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("qs-to-json");
  const [pretty, setPretty] = useState(true);
  const [includeQuestionMark, setIncludeQuestionMark] = useState(true);

  useEffect(() => {
    Clipboard.readText().then((t) => {
      if (!t) return;
      const trimmed = t.trim();
      try {
        JSON.parse(trimmed);
        setMode("json-to-qs");
        setInput(trimmed);
      } catch {
        if (trimmed.includes("=")) {
          setMode("qs-to-json");
          setInput(trimmed);
        }
      }
    });
  }, []);

  const output = useMemo(() => {
    if (!input.trim()) return "";
    try {
      if (mode === "qs-to-json") {
        const obj = queryStringToJson(input);
        return pretty ? JSON.stringify(obj, null, 2) : JSON.stringify(obj);
      } else {
        const qs = jsonToQueryString(input);
        return includeQuestionMark ? `?${qs}` : qs;
      }
    } catch (e) {
      return `Error: ${e instanceof Error ? e.message : String(e)}`;
    }
  }, [input, mode, pretty, includeQuestionMark]);

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.CopyToClipboard title="Copy Output" content={output} shortcut={{ modifiers: ["cmd"], key: "return" }} />
          <Action title="Swap Input / Output" onAction={() => setInput(output)} shortcut={{ modifiers: ["cmd"], key: "s" }} />
          <Action title="Clear" onAction={() => setInput("")} shortcut={{ modifiers: ["cmd"], key: "k" }} />
        </ActionPanel>
      }
    >
      <Form.Dropdown id="mode" title="Mode" value={mode} onChange={(v) => setMode(v as Mode)}>
        <Form.Dropdown.Item value="qs-to-json" title="Query String → JSON" />
        <Form.Dropdown.Item value="json-to-qs" title="JSON → Query String" />
      </Form.Dropdown>
      {mode === "qs-to-json" && (
        <Form.Checkbox id="pretty" title="Options" label="Pretty print JSON" value={pretty} onChange={setPretty} />
      )}
      {mode === "json-to-qs" && (
        <Form.Checkbox id="qmark" title="Options" label='Include "?" prefix' value={includeQuestionMark} onChange={setIncludeQuestionMark} />
      )}
      <Form.TextArea
        id="input"
        title="Input"
        placeholder={mode === "qs-to-json" ? "?foo=bar&baz=qux&arr=1&arr=2" : '{"foo": "bar", "baz": "qux"}'}
        value={input}
        onChange={setInput}
      />
      <Form.TextArea id="output" title="Output" value={output} onChange={() => undefined} />
    </Form>
  );
}
