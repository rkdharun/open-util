import { Action, ActionPanel, Clipboard, Form, showToast, Toast } from "@raycast/api";
import { useEffect, useMemo, useState } from "react";

type Mode = "format" | "minify" | "validate";

export default function JsonFormatter() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("format");
  const [indent, setIndent] = useState("2");

  useEffect(() => {
    Clipboard.readText().then((t) => {
      if (t) {
        try {
          JSON.parse(t);
          setInput(t);
        } catch {
          // not JSON, ignore
        }
      }
    });
  }, []);

  const output = useMemo(() => {
    if (!input.trim()) return "";
    try {
      const parsed = JSON.parse(input);
      if (mode === "validate") return "✅ Valid JSON";
      if (mode === "minify") return JSON.stringify(parsed);
      return JSON.stringify(parsed, null, parseInt(indent, 10));
    } catch (e) {
      return `❌ Invalid JSON: ${e instanceof Error ? e.message : String(e)}`;
    }
  }, [input, mode, indent]);

  async function copyOutput() {
    if (!output || output.startsWith("❌") || output.startsWith("✅")) return;
    await Clipboard.copy(output);
    await showToast({ style: Toast.Style.Success, title: "Copied to clipboard" });
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action title="Copy Output" onAction={copyOutput} />
          <Action.CopyToClipboard title="Copy Output" content={output} />
          <Action title="Clear" onAction={() => setInput("")} shortcut={{ modifiers: ["cmd"], key: "k" }} />
        </ActionPanel>
      }
    >
      <Form.Dropdown id="mode" title="Mode" value={mode} onChange={(v) => setMode(v as Mode)}>
        <Form.Dropdown.Item value="format" title="Format / Beautify" />
        <Form.Dropdown.Item value="minify" title="Minify" />
        <Form.Dropdown.Item value="validate" title="Validate Only" />
      </Form.Dropdown>
      {mode === "format" && (
        <Form.Dropdown id="indent" title="Indent" value={indent} onChange={setIndent}>
          <Form.Dropdown.Item value="2" title="2 Spaces" />
          <Form.Dropdown.Item value="4" title="4 Spaces" />
          <Form.Dropdown.Item value="1" title="1 Space" />
        </Form.Dropdown>
      )}
      <Form.TextArea
        id="input"
        title="Input JSON"
        placeholder="Paste JSON here..."
        value={input}
        onChange={setInput}
      />
      <Form.TextArea id="output" title="Output" value={output} onChange={() => undefined} />
    </Form>
  );
}
