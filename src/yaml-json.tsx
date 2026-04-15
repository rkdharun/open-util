import { Action, ActionPanel, Clipboard, Form } from "@raycast/api";
import yaml from "js-yaml";
import { useEffect, useMemo, useState } from "react";

type Mode = "yaml-to-json" | "json-to-yaml";

export default function YamlJson() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("yaml-to-json");
  const [indent, setIndent] = useState("2");

  useEffect(() => {
    Clipboard.readText().then((t) => {
      if (!t) return;
      // Try to guess mode from clipboard content
      try {
        JSON.parse(t);
        setMode("json-to-yaml");
        setInput(t);
      } catch {
        setInput(t);
      }
    });
  }, []);

  const output = useMemo(() => {
    if (!input.trim()) return "";
    try {
      if (mode === "yaml-to-json") {
        const obj = yaml.load(input);
        return JSON.stringify(obj, null, parseInt(indent, 10));
      } else {
        const obj = JSON.parse(input);
        return yaml.dump(obj, { indent: parseInt(indent, 10), lineWidth: -1 });
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
        <Form.Dropdown.Item value="yaml-to-json" title="YAML → JSON" />
        <Form.Dropdown.Item value="json-to-yaml" title="JSON → YAML" />
      </Form.Dropdown>
      <Form.Dropdown id="indent" title="Indent" value={indent} onChange={setIndent}>
        <Form.Dropdown.Item value="2" title="2 Spaces" />
        <Form.Dropdown.Item value="4" title="4 Spaces" />
      </Form.Dropdown>
      <Form.TextArea id="input" title="Input" placeholder="Paste YAML or JSON..." value={input} onChange={setInput} />
      <Form.TextArea id="output" title="Output" value={output} onChange={() => undefined} />
    </Form>
  );
}
