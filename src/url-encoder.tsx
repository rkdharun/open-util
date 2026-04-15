import { Action, ActionPanel, Clipboard, Form } from "@raycast/api";
import { useEffect, useMemo, useState } from "react";

type Mode = "encode" | "decode" | "encode-component" | "decode-component";

export default function UrlEncoder() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("encode");

  useEffect(() => {
    Clipboard.readText().then((t) => t && setInput(t));
  }, []);

  const output = useMemo(() => {
    if (!input) return "";
    try {
      switch (mode) {
        case "encode":
          return encodeURI(input);
        case "decode":
          return decodeURI(input);
        case "encode-component":
          return encodeURIComponent(input);
        case "decode-component":
          return decodeURIComponent(input);
      }
    } catch (e) {
      return `Error: ${e instanceof Error ? e.message : String(e)}`;
    }
  }, [input, mode]);

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.CopyToClipboard title="Copy Output" content={output ?? ""} shortcut={{ modifiers: ["cmd"], key: "return" }} />
          <Action title="Swap Input / Output" onAction={() => setInput(output ?? "")} shortcut={{ modifiers: ["cmd"], key: "s" }} />
          <Action title="Clear" onAction={() => setInput("")} shortcut={{ modifiers: ["cmd"], key: "k" }} />
        </ActionPanel>
      }
    >
      <Form.Dropdown id="mode" title="Mode" value={mode} onChange={(v) => setMode(v as Mode)}>
        <Form.Dropdown.Item value="encode" title="Encode URI" />
        <Form.Dropdown.Item value="decode" title="Decode URI" />
        <Form.Dropdown.Item value="encode-component" title="Encode URI Component" />
        <Form.Dropdown.Item value="decode-component" title="Decode URI Component" />
      </Form.Dropdown>
      <Form.TextArea id="input" title="Input" placeholder="Enter URL or text..." value={input} onChange={setInput} />
      <Form.TextArea id="output" title="Output" value={output ?? ""} onChange={() => undefined} />
    </Form>
  );
}
