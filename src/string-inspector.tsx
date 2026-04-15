import { Action, ActionPanel, Clipboard, Icon, List } from "@raycast/api";
import { useEffect, useMemo, useState } from "react";
import { formatBytes } from "./utils";

interface StatItem {
  id: string;
  label: string;
  value: string;
}

function getStats(text: string): StatItem[] {
  if (!text) return [];
  const utf8Bytes = Buffer.byteLength(text, "utf8");
  const utf16Bytes = text.length * 2;
  const lines = text.split(/\r?\n/);
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length;
  const paragraphs = text.split(/\n{2,}/).filter((p) => p.trim().length > 0).length;
  const spaces = (text.match(/ /g) || []).length;
  const unique = new Set(text).size;
  const digits = (text.match(/\d/g) || []).length;
  const letters = (text.match(/[a-zA-Z]/g) || []).length;
  const special = (text.match(/[^a-zA-Z0-9\s]/g) || []).length;

  // Character frequency (top 5)
  const freq: Record<string, number> = {};
  for (const c of text) freq[c] = (freq[c] || 0) + 1;
  const topChars = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([c, n]) => `'${c === "\n" ? "\\n" : c === " " ? "·" : c}' ×${n}`)
    .join(", ");

  return [
    { id: "chars", label: "Characters", value: text.length.toString() },
    { id: "chars-nospace", label: "Characters (no spaces)", value: (text.length - spaces).toString() },
    { id: "words", label: "Words", value: words.toString() },
    { id: "lines", label: "Lines", value: lines.length.toString() },
    { id: "sentences", label: "Sentences", value: sentences.toString() },
    { id: "paragraphs", label: "Paragraphs", value: paragraphs.toString() },
    { id: "bytes-utf8", label: "Bytes (UTF-8)", value: `${utf8Bytes} (${formatBytes(utf8Bytes)})` },
    { id: "bytes-utf16", label: "Bytes (UTF-16)", value: `${utf16Bytes} (${formatBytes(utf16Bytes)})` },
    { id: "letters", label: "Letters", value: letters.toString() },
    { id: "digits", label: "Digits", value: digits.toString() },
    { id: "spaces", label: "Spaces", value: spaces.toString() },
    { id: "special", label: "Special Characters", value: special.toString() },
    { id: "unique", label: "Unique Characters", value: unique.toString() },
    { id: "top-chars", label: "Top Characters", value: topChars },
    { id: "starts-with", label: "Starts With", value: JSON.stringify(text.slice(0, 20)) + (text.length > 20 ? "…" : "") },
    { id: "ends-with", label: "Ends With", value: "…" + JSON.stringify(text.slice(-20)) },
  ];
}

export default function StringInspector() {
  const [input, setInput] = useState("");

  useEffect(() => {
    Clipboard.readText().then((t) => t && setInput(t));
  }, []);

  const stats = useMemo(() => getStats(input), [input]);

  return (
    <List
      searchBarPlaceholder="Type or paste text to inspect..."
      onSearchTextChange={setInput}
      searchText={input}
    >
      {stats.length === 0 ? (
        <List.EmptyView title="Enter text to inspect" icon={Icon.MagnifyingGlass} />
      ) : (
        <List.Section title="String Statistics">
          {stats.map((s) => (
            <List.Item
              key={s.id}
              title={s.value}
              subtitle={s.label}
              actions={
                <ActionPanel>
                  <Action.CopyToClipboard title="Copy Value" content={s.value} />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      )}
    </List>
  );
}
