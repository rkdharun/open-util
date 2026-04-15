import { Action, ActionPanel, Clipboard, Detail, Form, useNavigation } from "@raycast/api";
import { marked } from "marked";
import { useEffect, useState } from "react";

function MarkdownDetailView({ markdown }: { markdown: string }) {
  return (
    <Detail
      markdown={markdown}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard title="Copy Markdown" content={markdown} />
          <Action
            title="Copy as HTML"
            onAction={async () => {
              const html = String(marked.parse(markdown, { async: false }));
              await Clipboard.copy(html);
            }}
          />
        </ActionPanel>
      }
    />
  );
}

export default function MarkdownPreview() {
  const [input, setInput] = useState("");
  const { push } = useNavigation();

  useEffect(() => {
    Clipboard.readText().then((t) => t && setInput(t));
  }, []);

  return (
    <Form
      actions={
        <ActionPanel>
          <Action title="Preview Markdown" onAction={() => push(<MarkdownDetailView markdown={input} />)} shortcut={{ modifiers: ["cmd"], key: "return" }} />
          <Action
            title="Copy as HTML"
            onAction={async () => {
              const html = await marked.parse(input);
              await Clipboard.copy(html);
            }}
            shortcut={{ modifiers: ["cmd"], key: "h" }}
          />
          <Action title="Clear" onAction={() => setInput("")} shortcut={{ modifiers: ["cmd"], key: "k" }} />
        </ActionPanel>
      }
    >
      <Form.TextArea
        id="input"
        title="Markdown Input"
        placeholder="# Hello World&#10;&#10;Enter **Markdown** here..."
        value={input}
        onChange={setInput}
        autoFocus
      />
      <Form.Description title="Tip" text="Press ⌘↩ to preview rendered Markdown" />
    </Form>
  );
}
