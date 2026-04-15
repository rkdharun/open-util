import { Action, ActionPanel, Clipboard, Form, showToast, Toast } from "@raycast/api";
import { useEffect, useMemo, useState } from "react";

type Mode = "encode" | "decode";
type Charset = "utf8" | "ascii" | "latin1";

export default function Base64() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("encode");
  const [charset, setCharset] = useState<Charset>("utf8");

  useEffect(() => {
    Clipboard.readText().then((t) => t && setInput(t));
  }, []);

  const output = useMemo(() => {
    if (!input) return "";
    try {
      if (mode === "encode") {
        return Buffer.from(input, charset).toString("base64");
      } else {
        return Buffer.from(input, "base64").toString(charset);
      }
    } catch (e) {
      return `Error: ${e instanceof Error ? e.message : String(e)}`;
    }
  }, [input, mode, charset]);

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
        <Form.Dropdown.Item value="encode" title="Encode → Base64" />
        <Form.Dropdown.Item value="decode" title="Decode ← Base64" />
      </Form.Dropdown>
      <Form.Dropdown id="charset" title="Charset" value={charset} onChange={(v) => setCharset(v as Charset)}>
        <Form.Dropdown.Item value="utf8" title="UTF-8" />
        <Form.Dropdown.Item value="ascii" title="ASCII" />
        <Form.Dropdown.Item value="latin1" title="Latin-1" />
      </Form.Dropdown>
      <Form.TextArea id="input" title="Input" placeholder="Enter text..." value={input} onChange={setInput} />
      <Form.TextArea id="output" title="Output" value={output} onChange={() => undefined} />
    </Form>
  );
}
