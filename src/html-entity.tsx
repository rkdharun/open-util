import { Action, ActionPanel, Clipboard, Form } from "@raycast/api";
import he from "he";
import { useEffect, useMemo, useState } from "react";

type Mode = "encode" | "decode";

export default function HtmlEntity() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("encode");
  const [encodeEverything, setEncodeEverything] = useState(false);

  useEffect(() => {
    Clipboard.readText().then((t) => t && setInput(t));
  }, []);

  const output = useMemo(() => {
    if (!input) return "";
    try {
      if (mode === "encode") {
        return he.encode(input, { useNamedReferences: true, allowUnsafeSymbols: !encodeEverything });
      } else {
        return he.decode(input);
      }
    } catch (e) {
      return `Error: ${e instanceof Error ? e.message : String(e)}`;
    }
  }, [input, mode, encodeEverything]);

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
        <Form.Dropdown.Item value="encode" title="Encode HTML Entities" />
        <Form.Dropdown.Item value="decode" title="Decode HTML Entities" />
      </Form.Dropdown>
      {mode === "encode" && (
        <Form.Checkbox
          id="encodeEverything"
          title="Options"
          label="Encode every character"
          value={encodeEverything}
          onChange={setEncodeEverything}
        />
      )}
      <Form.TextArea id="input" title="Input" placeholder="Enter text with HTML entities..." value={input} onChange={setInput} />
      <Form.TextArea id="output" title="Output" value={output} onChange={() => undefined} />
    </Form>
  );
}
