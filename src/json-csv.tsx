import { Action, ActionPanel, Clipboard, Form } from "@raycast/api";
import Papa from "papaparse";
import { useEffect, useMemo, useState } from "react";

type Mode = "json-to-csv" | "csv-to-json";

export default function JsonCsv() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("json-to-csv");
  const [hasHeader, setHasHeader] = useState(true);
  const [pretty, setPretty] = useState(true);

  useEffect(() => {
    Clipboard.readText().then((t) => {
      if (!t) return;
      try {
        JSON.parse(t);
        setMode("json-to-csv");
      } catch {
        setMode("csv-to-json");
      }
      setInput(t);
    });
  }, []);

  const output = useMemo(() => {
    if (!input.trim()) return "";
    try {
      if (mode === "json-to-csv") {
        const data = JSON.parse(input);
        if (!Array.isArray(data)) throw new Error("Input must be a JSON array of objects");
        return Papa.unparse(data);
      } else {
        const result = Papa.parse(input, { header: hasHeader, skipEmptyLines: true, dynamicTyping: true });
        if (result.errors.length > 0) throw new Error(result.errors[0].message);
        return pretty
          ? JSON.stringify(result.data, null, 2)
          : JSON.stringify(result.data);
      }
    } catch (e) {
      return `Error: ${e instanceof Error ? e.message : String(e)}`;
    }
  }, [input, mode, hasHeader, pretty]);

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
        <Form.Dropdown.Item value="json-to-csv" title="JSON → CSV" />
        <Form.Dropdown.Item value="csv-to-json" title="CSV → JSON" />
      </Form.Dropdown>
      {mode === "csv-to-json" && (
        <>
          <Form.Checkbox id="hasHeader" title="Options" label="First row is header" value={hasHeader} onChange={setHasHeader} />
          <Form.Checkbox id="pretty" title=" " label="Pretty print JSON" value={pretty} onChange={setPretty} />
        </>
      )}
      <Form.TextArea id="input" title="Input" placeholder="Paste JSON array or CSV data..." value={input} onChange={setInput} />
      <Form.TextArea id="output" title="Output" value={output} onChange={() => undefined} />
    </Form>
  );
}
