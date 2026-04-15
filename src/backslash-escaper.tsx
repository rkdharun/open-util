import { Action, ActionPanel, Clipboard, Form } from "@raycast/api";
import { useEffect, useMemo, useState } from "react";

type Mode = "escape" | "unescape";

export default function BackslashEscaper() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("escape");

  useEffect(() => {
    Clipboard.readText().then((t) => t && setInput(t));
  }, []);

  const output = useMemo(() => {
    if (!input) return "";
    try {
      if (mode === "escape") {
        return input
          .replace(/\\/g, "\\\\")
          .replace(/"/g, '\\"')
          .replace(/'/g, "\\'")
          .replace(/\n/g, "\\n")
          .replace(/\r/g, "\\r")
          .replace(/\t/g, "\\t")
          .replace(/\f/g, "\\f")
          .replace(/\b/g, "\\b")
          .replace(/\0/g, "\\0");
      } else {
        return input
          .replace(/\\0/g, "\0")
          .replace(/\\b/g, "\b")
          .replace(/\\f/g, "\f")
          .replace(/\\t/g, "\t")
          .replace(/\\r/g, "\r")
          .replace(/\\n/g, "\n")
          .replace(/\\'/g, "'")
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, "\\");
      }
    } catch (e) {
      return `Error: ${e instanceof Error ? e.message : String(e)}`;
    }
  }, [input, mode]);

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
        <Form.Dropdown.Item value="escape" title="Escape Backslashes" />
        <Form.Dropdown.Item value="unescape" title="Unescape Backslashes" />
      </Form.Dropdown>
      <Form.TextArea id="input" title="Input" placeholder="Enter text to escape/unescape..." value={input} onChange={setInput} />
      <Form.TextArea id="output" title="Output" value={output} onChange={() => undefined} />
    </Form>
  );
}
