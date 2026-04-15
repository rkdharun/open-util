import { Action, ActionPanel, Clipboard, Form } from "@raycast/api";
import { JSONPath } from "jsonpath-plus";
import { useEffect, useMemo, useState } from "react";

export default function JsonPathSelector() {
  const [jsonInput, setJsonInput] = useState("");
  const [path, setPath] = useState("$");
  const [wrap, setWrap] = useState(true);

  useEffect(() => {
    Clipboard.readText().then((t) => {
      if (!t) return;
      try {
        JSON.parse(t);
        setJsonInput(t);
      } catch {
        // not JSON
      }
    });
  }, []);

  const output = useMemo(() => {
    if (!jsonInput.trim() || !path.trim()) return "";
    try {
      const json = JSON.parse(jsonInput);
      const result = JSONPath({ path: path.trim(), json, wrap });
      return JSON.stringify(result, null, 2);
    } catch (e) {
      return `Error: ${e instanceof Error ? e.message : String(e)}`;
    }
  }, [jsonInput, path, wrap]);

  const resultCount = useMemo(() => {
    try {
      const r = JSON.parse(output);
      return Array.isArray(r) ? r.length : null;
    } catch {
      return null;
    }
  }, [output]);

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.CopyToClipboard title="Copy Result" content={output} shortcut={{ modifiers: ["cmd"], key: "return" }} />
          <Action title="Clear" onAction={() => { setJsonInput(""); setPath("$"); }} shortcut={{ modifiers: ["cmd"], key: "k" }} />
        </ActionPanel>
      }
    >
      <Form.TextArea
        id="json"
        title="Input JSON"
        placeholder='{"store": {"books": [{"title": "Example"}]}}'
        value={jsonInput}
        onChange={setJsonInput}
      />
      <Form.TextField
        id="path"
        title="JSONPath Expression"
        placeholder="e.g. $.store.books[*].title"
        value={path}
        onChange={setPath}
      />
      <Form.Checkbox id="wrap" title="Options" label="Wrap results in array" value={wrap} onChange={setWrap} />
      {resultCount !== null && (
        <Form.Description title="Results" text={`${resultCount} item${resultCount !== 1 ? "s" : ""} found`} />
      )}
      <Form.TextArea id="output" title="Result" value={output} onChange={() => undefined} />
    </Form>
  );
}
