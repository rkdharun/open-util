import { Action, ActionPanel, Clipboard, Detail, Form, useNavigation } from "@raycast/api";
import { useEffect, useMemo, useState } from "react";

interface Match {
  index: number;
  value: string;
  groups: Record<string, string> | undefined;
}

function getMatches(pattern: string, flags: string, text: string): { matches: Match[]; error: string | null } {
  if (!pattern || !text) return { matches: [], error: null };
  try {
    const regex = new RegExp(pattern, flags);
    const matches: Match[] = [];
    let m: RegExpExecArray | null;

    if (flags.includes("g")) {
      while ((m = regex.exec(text)) !== null) {
        matches.push({ index: m.index, value: m[0], groups: m.groups });
        if (m[0].length === 0) regex.lastIndex++; // avoid infinite loop on zero-length match
        if (matches.length > 1000) break;
      }
    } else {
      m = regex.exec(text);
      if (m) matches.push({ index: m.index, value: m[0], groups: m.groups });
    }
    return { matches, error: null };
  } catch (e) {
    return { matches: [], error: e instanceof Error ? e.message : String(e) };
  }
}

function buildMarkdown(pattern: string, flags: string, text: string, matches: Match[], error: string | null): string {
  const lines: string[] = [];
  if (error) {
    lines.push(`## ❌ Error\n\`\`\`\n${error}\n\`\`\``);
    return lines.join("\n");
  }
  if (!pattern) {
    lines.push("## Enter a pattern to start matching");
    return lines.join("\n");
  }

  lines.push(`## RegExp: \`/${pattern}/${flags}\``);
  lines.push(`**${matches.length} match${matches.length !== 1 ? "es" : ""}** found`);
  lines.push("");

  if (matches.length > 0) {
    lines.push("### Matches");
    matches.slice(0, 50).forEach((m, i) => {
      lines.push(`**${i + 1}.** \`${m.value}\` at index ${m.index}`);
      if (m.groups && Object.keys(m.groups).length > 0) {
        lines.push("  Named groups:");
        for (const [k, v] of Object.entries(m.groups)) {
          lines.push(`  - \`${k}\`: \`${v ?? "(undefined)"}\``);
        }
      }
    });
    if (matches.length > 50) lines.push(`_…and ${matches.length - 50} more_`);
  }

  return lines.join("\n");
}

export default function RegexpTester() {
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState("g");
  const [testStr, setTestStr] = useState("");
  const { push } = useNavigation();

  useEffect(() => {
    Clipboard.readText().then((t) => t && setTestStr(t));
  }, []);

  const { matches, error } = useMemo(() => getMatches(pattern, flags, testStr), [pattern, flags, testStr]);

  const markdown = useMemo(
    () => buildMarkdown(pattern, flags, testStr, matches, error),
    [pattern, flags, testStr, matches, error]
  );

  function viewResults() {
    push(<Detail markdown={markdown} />);
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action title="View Results" onAction={viewResults} shortcut={{ modifiers: ["cmd"], key: "return" }} />
          <Action
            title="Copy Matches"
            onAction={async () => {
              await Clipboard.copy(matches.map((m) => m.value).join("\n"));
            }}
            shortcut={{ modifiers: ["cmd"], key: "m" }}
          />
          <Action title="Clear" onAction={() => { setPattern(""); setTestStr(""); }} shortcut={{ modifiers: ["cmd"], key: "k" }} />
        </ActionPanel>
      }
    >
      <Form.TextField id="pattern" title="Pattern" placeholder="e.g. \\d+" value={pattern} onChange={setPattern} />
      <Form.TextField id="flags" title="Flags" placeholder="g, i, m, s, u" value={flags} onChange={setFlags} />
      <Form.TextArea id="testStr" title="Test String" placeholder="Enter text to test against..." value={testStr} onChange={setTestStr} />
      <Form.Description
        title="Matches"
        text={
          error
            ? `❌ ${error}`
            : pattern && testStr
            ? `✅ ${matches.length} match${matches.length !== 1 ? "es" : ""} found — press ⌘↩ to view details`
            : "Enter a pattern and test string"
        }
      />
    </Form>
  );
}
