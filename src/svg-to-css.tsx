import { Action, ActionPanel, Clipboard, Form } from "@raycast/api";
import { useEffect, useMemo, useState } from "react";

type Encoding = "base64" | "url" | "none";
type OutputType = "background-image" | "content" | "mask-image";

function svgToDataUrl(svg: string, encoding: Encoding): string {
  const clean = svg.trim();
  if (encoding === "base64") {
    return `data:image/svg+xml;base64,${Buffer.from(clean).toString("base64")}`;
  } else if (encoding === "url") {
    const encoded = encodeURIComponent(clean)
      .replace(/%20/g, " ")
      .replace(/%3D/g, "=")
      .replace(/%3A/g, ":")
      .replace(/%2F/g, "/");
    return `data:image/svg+xml,${encoded}`;
  } else {
    return `data:image/svg+xml,${clean}`;
  }
}

export default function SvgToCss() {
  const [input, setInput] = useState("");
  const [encoding, setEncoding] = useState<Encoding>("base64");
  const [outputType, setOutputType] = useState<OutputType>("background-image");
  const [selector, setSelector] = useState(".icon");

  useEffect(() => {
    Clipboard.readText().then((t) => {
      if (t && (t.trim().startsWith("<svg") || t.trim().startsWith("<?xml"))) setInput(t.trim());
    });
  }, []);

  const output = useMemo(() => {
    if (!input.trim()) return "";
    try {
      const dataUrl = svgToDataUrl(input, encoding);
      const rule = `${selector} {\n  ${outputType}: url("${dataUrl}");\n  background-repeat: no-repeat;\n  background-size: contain;\n}`;
      return rule;
    } catch (e) {
      return `Error: ${e instanceof Error ? e.message : String(e)}`;
    }
  }, [input, encoding, outputType, selector]);

  const dataUrl = useMemo(() => {
    if (!input.trim()) return "";
    try {
      return svgToDataUrl(input, encoding);
    } catch {
      return "";
    }
  }, [input, encoding]);

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.CopyToClipboard title="Copy CSS Rule" content={output} shortcut={{ modifiers: ["cmd"], key: "return" }} />
          <Action.CopyToClipboard title="Copy Data URL Only" content={dataUrl} shortcut={{ modifiers: ["cmd", "shift"], key: "u" }} />
          <Action title="Clear" onAction={() => setInput("")} shortcut={{ modifiers: ["cmd"], key: "k" }} />
        </ActionPanel>
      }
    >
      <Form.Dropdown id="encoding" title="Encoding" value={encoding} onChange={(v) => setEncoding(v as Encoding)}>
        <Form.Dropdown.Item value="base64" title="Base64" />
        <Form.Dropdown.Item value="url" title="URL Encoded" />
        <Form.Dropdown.Item value="none" title="None (raw)" />
      </Form.Dropdown>
      <Form.Dropdown id="outputType" title="CSS Property" value={outputType} onChange={(v) => setOutputType(v as OutputType)}>
        <Form.Dropdown.Item value="background-image" title="background-image" />
        <Form.Dropdown.Item value="content" title="content" />
        <Form.Dropdown.Item value="mask-image" title="mask-image" />
      </Form.Dropdown>
      <Form.TextField id="selector" title="CSS Selector" value={selector} onChange={setSelector} placeholder=".icon" />
      <Form.TextArea id="input" title="Input SVG" placeholder="<svg xmlns='http://www.w3.org/2000/svg'>...</svg>" value={input} onChange={setInput} />
      <Form.TextArea id="output" title="CSS Output" value={output} onChange={() => undefined} />
    </Form>
  );
}
