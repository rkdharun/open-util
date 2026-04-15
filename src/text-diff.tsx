import { Action, ActionPanel, Clipboard, Detail, Form, useNavigation } from "@raycast/api";
import * as Diff from "diff";
import { useEffect, useMemo, useState } from "react";

type DiffMode = "lines" | "words" | "chars";

function buildDiffMarkdown(oldText: string, newText: string, mode: DiffMode): string {
  if (!oldText && !newText) return "Enter text in both fields to see a diff.";

  let parts: Diff.Change[];
  switch (mode) {
    case "words":
      parts = Diff.diffWords(oldText, newText);
      break;
    case "chars":
      parts = Diff.diffChars(oldText, newText);
      break;
    default:
      parts = Diff.diffLines(oldText, newText);
  }

  const added = parts.filter((p) => p.added).reduce((acc, p) => acc + (p.count || 0), 0);
  const removed = parts.filter((p) => p.removed).reduce((acc, p) => acc + (p.count || 0), 0);
  const unchanged = parts.filter((p) => !p.added && !p.removed).reduce((acc, p) => acc + (p.count || 0), 0);
  const unit = mode === "chars" ? "char" : mode === "words" ? "word" : "line";

  const lines: string[] = [
    `## Diff (${mode})`,
    `+${added} ${unit}s added · -${removed} ${unit}s removed · ${unchanged} ${unit}s unchanged`,
    "",
    "```diff",
  ];

  for (const part of parts) {
    const prefix = part.added ? "+" : part.removed ? "-" : " ";
    const content = part.value;
    const segmentLines = content.split("\n");
    for (let i = 0; i < segmentLines.length; i++) {
      // skip trailing empty line from split
      if (i === segmentLines.length - 1 && segmentLines[i] === "") continue;
      lines.push(`${prefix}${segmentLines[i]}`);
    }
  }

  lines.push("```");
  return lines.join("\n");
}

export default function TextDiff() {
  const [oldText, setOldText] = useState("");
  const [newText, setNewText] = useState("");
  const [mode, setMode] = useState<DiffMode>("lines");
  const { push } = useNavigation();

  useEffect(() => {
    Clipboard.readText().then((t) => t && setOldText(t));
  }, []);

  const markdown = useMemo(() => buildDiffMarkdown(oldText, newText, mode), [oldText, newText, mode]);

  return (
    <Form
      actions={
        <ActionPanel>
          <Action title="View Diff" onAction={() => push(<Detail markdown={markdown} />)} shortcut={{ modifiers: ["cmd"], key: "return" }} />
          <Action title="Swap Texts" onAction={() => { setOldText(newText); setNewText(oldText); }} shortcut={{ modifiers: ["cmd"], key: "s" }} />
          <Action title="Clear" onAction={() => { setOldText(""); setNewText(""); }} shortcut={{ modifiers: ["cmd"], key: "k" }} />
        </ActionPanel>
      }
    >
      <Form.Dropdown id="mode" title="Diff Mode" value={mode} onChange={(v) => setMode(v as DiffMode)}>
        <Form.Dropdown.Item value="lines" title="Line Diff" />
        <Form.Dropdown.Item value="words" title="Word Diff" />
        <Form.Dropdown.Item value="chars" title="Character Diff" />
      </Form.Dropdown>
      <Form.TextArea id="old" title="Original Text" placeholder="Paste original text..." value={oldText} onChange={setOldText} />
      <Form.TextArea id="new" title="Modified Text" placeholder="Paste modified text..." value={newText} onChange={setNewText} />
    </Form>
  );
}
