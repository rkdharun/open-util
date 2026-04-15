import { Action, ActionPanel, Clipboard, Form } from "@raycast/api";
import { XMLBuilder, XMLParser } from "fast-xml-parser";
import { useEffect, useMemo, useState } from "react";

type Mode = "beautify" | "minify";

export default function XmlBeautifier() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("beautify");
  const [indent, setIndent] = useState("2");

  useEffect(() => {
    Clipboard.readText().then((t) => t && setInput(t));
  }, []);

  const output = useMemo(() => {
    if (!input.trim()) return "";
    try {
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
        preserveOrder: true,
        parseTagValue: false,
        trimValues: false,
      });
      const parsed = parser.parse(input);

      const builder = new XMLBuilder({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
        preserveOrder: true,
        format: mode === "beautify",
        indentBy: " ".repeat(parseInt(indent, 10)),
        suppressEmptyNode: false,
      });

      return builder.build(parsed);
    } catch (e) {
      return `Error: ${e instanceof Error ? e.message : String(e)}`;
    }
  }, [input, mode, indent]);

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
        <Form.Dropdown.Item value="beautify" title="Beautify / Format" />
        <Form.Dropdown.Item value="minify" title="Minify" />
      </Form.Dropdown>
      {mode === "beautify" && (
        <Form.Dropdown id="indent" title="Indent" value={indent} onChange={setIndent}>
          <Form.Dropdown.Item value="2" title="2 Spaces" />
          <Form.Dropdown.Item value="4" title="4 Spaces" />
        </Form.Dropdown>
      )}
      <Form.TextArea id="input" title="Input XML" placeholder="Paste XML here..." value={input} onChange={setInput} />
      <Form.TextArea id="output" title="Output" value={output} onChange={() => undefined} />
    </Form>
  );
}
