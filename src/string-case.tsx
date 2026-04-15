import { Action, ActionPanel, Clipboard, Icon, List } from "@raycast/api";
import {
  camelCase,
  capitalCase,
  constantCase,
  dotCase,
  headerCase,
  noCase,
  paramCase,
  pascalCase,
  pathCase,
  sentenceCase,
  snakeCase,
} from "change-case";
import { useEffect, useMemo, useState } from "react";

interface ConversionItem {
  id: string;
  label: string;
  example: string;
  fn: (s: string) => string;
}

const CONVERSIONS: ConversionItem[] = [
  { id: "camel", label: "camelCase", example: "helloWorld", fn: camelCase },
  { id: "pascal", label: "PascalCase", example: "HelloWorld", fn: pascalCase },
  { id: "snake", label: "snake_case", example: "hello_world", fn: snakeCase },
  { id: "constant", label: "CONSTANT_CASE", example: "HELLO_WORLD", fn: constantCase },
  { id: "param", label: "kebab-case", example: "hello-world", fn: paramCase },
  { id: "header", label: "Header-Case", example: "Hello-World", fn: headerCase },
  { id: "no", label: "no case", example: "hello world", fn: noCase },
  { id: "dot", label: "dot.case", example: "hello.world", fn: dotCase },
  { id: "path", label: "path/case", example: "hello/world", fn: pathCase },
  { id: "sentence", label: "Sentence case", example: "Hello world", fn: sentenceCase },
  { id: "capital", label: "Capital Case", example: "Hello World", fn: capitalCase },
  { id: "upper", label: "UPPER CASE", example: "HELLO WORLD", fn: (s) => s.toUpperCase() },
  { id: "lower", label: "lower case", example: "hello world", fn: (s) => s.toLowerCase() },
  { id: "title", label: "Title Case", example: "Hello World", fn: (s) => s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()) },
  { id: "alternating", label: "aLtErNaTiNg CaSe", example: "hElLo WoRlD", fn: (s) => s.split("").map((c, i) => i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()).join("") },
  { id: "reverse", label: "esreveR", example: "dlroW olleH", fn: (s) => s.split("").reverse().join("") },
];

export default function StringCase() {
  const [input, setInput] = useState("");

  useEffect(() => {
    Clipboard.readText().then((t) => t && setInput(t));
  }, []);

  const results = useMemo(
    () =>
      CONVERSIONS.map((c) => {
        try {
          return { ...c, result: c.fn(input) };
        } catch {
          return { ...c, result: "" };
        }
      }),
    [input]
  );

  return (
    <List
      searchBarPlaceholder="Type or paste text to convert..."
      onSearchTextChange={setInput}
      searchText={input}
    >
      {input ? (
        <List.Section title={`Conversions for: "${input.slice(0, 30)}${input.length > 30 ? "…" : ""}"`}>
          {results.map((r) => (
            <List.Item
              key={r.id}
              title={r.result || "(empty)"}
              subtitle={r.label}
              accessories={[{ text: r.label }]}
              actions={
                <ActionPanel>
                  <Action.CopyToClipboard title={`Copy ${r.label}`} content={r.result} />
                  <Action.CopyToClipboard
                    title="Copy All Conversions"
                    content={results.map((x) => `${x.label}: ${x.result}`).join("\n")}
                    shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
                  />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      ) : (
        <List.EmptyView title="Enter text to see all case conversions" icon={Icon.TextCursor} />
      )}
    </List>
  );
}
