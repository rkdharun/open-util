import { Action, ActionPanel, Clipboard, Form, showToast, Toast } from "@raycast/api";
import { LoremIpsum } from "lorem-ipsum";
import { useCallback, useMemo, useState } from "react";

type Unit = "words" | "sentences" | "paragraphs";

const lorem = new LoremIpsum({
  sentencesPerParagraph: { max: 8, min: 4 },
  wordsPerSentence: { max: 16, min: 4 },
});

export default function LoremIpsumGenerator() {
  const [unit, setUnit] = useState<Unit>("paragraphs");
  const [count, setCount] = useState("3");
  const [seed, setSeed] = useState(0);
  const [startWithLorem, setStartWithLorem] = useState(true);

  const generated = useMemo(() => {
    const n = Math.min(Math.max(parseInt(count, 10) || 3, 1), 100);

    let text: string;
    switch (unit) {
      case "words":
        text = lorem.generateWords(n);
        break;
      case "sentences":
        text = lorem.generateSentences(n);
        break;
      case "paragraphs":
        text = lorem.generateParagraphs(n);
        break;
    }

    if (startWithLorem && unit !== "words") {
      text = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. " + text;
    } else if (startWithLorem && unit === "words") {
      text = "lorem ipsum " + text;
    }

    return text;
  }, [unit, count, seed, startWithLorem]);

  const regenerate = useCallback(() => setSeed((s) => s + 1), []);

  const wordCount = useMemo(() => generated.split(/\s+/).filter(Boolean).length, [generated]);
  const charCount = useMemo(() => generated.length, [generated]);

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.CopyToClipboard
            title="Copy to Clipboard"
            content={generated}
            shortcut={{ modifiers: ["cmd"], key: "return" }}
            onCopy={async () => {
              await showToast({ style: Toast.Style.Success, title: "Copied lorem ipsum text" });
            }}
          />
          <Action title="Regenerate" onAction={regenerate} shortcut={{ modifiers: ["cmd"], key: "r" }} />
          <Action
            title="Copy as HTML Paragraphs"
            onAction={async () => {
              const html = generated.split("\n\n").map((p) => `<p>${p}</p>`).join("\n");
              await Clipboard.copy(html);
              await showToast({ style: Toast.Style.Success, title: "Copied as HTML" });
            }}
            shortcut={{ modifiers: ["cmd", "shift"], key: "h" }}
          />
        </ActionPanel>
      }
    >
      <Form.Dropdown id="unit" title="Generate" value={unit} onChange={(v) => setUnit(v as Unit)}>
        <Form.Dropdown.Item value="paragraphs" title="Paragraphs" />
        <Form.Dropdown.Item value="sentences" title="Sentences" />
        <Form.Dropdown.Item value="words" title="Words" />
      </Form.Dropdown>
      <Form.TextField id="count" title="Count" value={count} onChange={setCount} placeholder="3" />
      <Form.Checkbox
        id="startWithLorem"
        title="Options"
        label='Start with "Lorem ipsum..."'
        value={startWithLorem}
        onChange={setStartWithLorem}
      />
      <Form.Description title="Stats" text={`${wordCount} words · ${charCount} characters`} />
      <Form.TextArea id="output" title="Generated Text" value={generated} onChange={() => undefined} />
    </Form>
  );
}
