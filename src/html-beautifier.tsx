import { Action, ActionPanel, Clipboard, Form } from "@raycast/api";
import jsBeautify from "js-beautify";
import { useEffect, useMemo, useState } from "react";

type Mode = "beautify" | "minify";

export default function HtmlBeautifier() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("beautify");
  const [indent, setIndent] = useState("2");

  useEffect(() => {
    Clipboard.readText().then((t) => t && setInput(t));
  }, []);

  const output = useMemo(() => {
    if (!input.trim()) return "";
    try {
      if (mode === "beautify") {
        return jsBeautify.html(input, {
          indent_size: parseInt(indent, 10),
          max_preserve_newlines: 1,
          preserve_newlines: true,
          end_with_newline: false,
          wrap_line_length: 0,
        });
      } else {
        // Minify by removing whitespace between tags
        return input
          .replace(/\s+/g, " ")
          .replace(/>\s+</g, "><")
          .replace(/<!--[\s\S]*?-->/g, "")
          .trim();
      }
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
      <Form.TextArea id="input" title="Input HTML" placeholder="Paste HTML here..." value={input} onChange={setInput} />
      <Form.TextArea id="output" title="Output" value={output} onChange={() => undefined} />
    </Form>
  );
}
