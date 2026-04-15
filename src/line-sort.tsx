import { Action, ActionPanel, Clipboard, Form } from "@raycast/api";
import { useEffect, useMemo, useState } from "react";

type SortMode = "az" | "za" | "length-asc" | "length-desc" | "reverse" | "shuffle" | "original";

export default function LineSort() {
  const [input, setInput] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("az");
  const [dedupe, setDedupe] = useState(false);
  const [trimLines, setTrimLines] = useState(true);
  const [removeEmpty, setRemoveEmpty] = useState(true);
  const [caseSensitive, setCaseSensitive] = useState(false);

  useEffect(() => {
    Clipboard.readText().then((t) => t && setInput(t));
  }, []);

  const output = useMemo(() => {
    if (!input.trim()) return "";

    let lines = input.split(/\r?\n/);

    if (trimLines) lines = lines.map((l) => l.trim());
    if (removeEmpty) lines = lines.filter((l) => l.length > 0);
    if (dedupe) {
      const seen = new Set<string>();
      lines = lines.filter((l) => {
        const key = caseSensitive ? l : l.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    switch (sortMode) {
      case "az":
        lines.sort((a, b) =>
          caseSensitive ? a.localeCompare(b) : a.toLowerCase().localeCompare(b.toLowerCase())
        );
        break;
      case "za":
        lines.sort((a, b) =>
          caseSensitive ? b.localeCompare(a) : b.toLowerCase().localeCompare(a.toLowerCase())
        );
        break;
      case "length-asc":
        lines.sort((a, b) => a.length - b.length);
        break;
      case "length-desc":
        lines.sort((a, b) => b.length - a.length);
        break;
      case "reverse":
        lines.reverse();
        break;
      case "shuffle":
        for (let i = lines.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [lines[i], lines[j]] = [lines[j], lines[i]];
        }
        break;
      case "original":
        // no sort
        break;
    }

    return lines.join("\n");
  }, [input, sortMode, dedupe, trimLines, removeEmpty, caseSensitive]);

  const stats = useMemo(() => {
    if (!input) return "";
    const inLines = input.split(/\r?\n/).length;
    const outLines = output ? output.split("\n").length : 0;
    return `${inLines} → ${outLines} lines`;
  }, [input, output]);

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
      <Form.Dropdown id="sortMode" title="Sort Mode" value={sortMode} onChange={(v) => setSortMode(v as SortMode)}>
        <Form.Dropdown.Item value="az" title="A → Z" />
        <Form.Dropdown.Item value="za" title="Z → A" />
        <Form.Dropdown.Item value="length-asc" title="Shortest First" />
        <Form.Dropdown.Item value="length-desc" title="Longest First" />
        <Form.Dropdown.Item value="reverse" title="Reverse Order" />
        <Form.Dropdown.Item value="shuffle" title="Shuffle" />
        <Form.Dropdown.Item value="original" title="Original Order (no sort)" />
      </Form.Dropdown>
      <Form.Checkbox id="dedupe" title="Options" label="Remove duplicate lines" value={dedupe} onChange={setDedupe} />
      <Form.Checkbox id="trimLines" title=" " label="Trim whitespace from lines" value={trimLines} onChange={setTrimLines} />
      <Form.Checkbox id="removeEmpty" title=" " label="Remove empty lines" value={removeEmpty} onChange={setRemoveEmpty} />
      <Form.Checkbox id="caseSensitive" title=" " label="Case-sensitive comparison" value={caseSensitive} onChange={setCaseSensitive} />
      {stats ? <Form.Description title="Stats" text={stats} /> : null}
      <Form.TextArea id="input" title="Input" placeholder="Paste text lines here..." value={input} onChange={setInput} />
      <Form.TextArea id="output" title="Output" value={output} onChange={() => undefined} />
    </Form>
  );
}
