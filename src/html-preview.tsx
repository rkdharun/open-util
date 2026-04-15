import { Action, ActionPanel, Clipboard, Form, open, showToast, Toast } from "@raycast/api";
import { writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { useEffect, useState } from "react";

export default function HtmlPreview() {
  const [input, setInput] = useState("");

  useEffect(() => {
    Clipboard.readText().then((t) => {
      if (t && /<[a-z][\s\S]*>/i.test(t)) setInput(t);
    });
  }, []);

  async function preview() {
    if (!input.trim()) {
      await showToast({ style: Toast.Style.Failure, title: "Please enter HTML first" });
      return;
    }

    const html = input.includes("<!DOCTYPE") || input.includes("<html")
      ? input
      : `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HTML Preview</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 2rem; }
  </style>
</head>
<body>
${input}
</body>
</html>`;

    const tmpFile = join(tmpdir(), `devutils-preview-${Date.now()}.html`);
    writeFileSync(tmpFile, html, "utf8");
    await open(tmpFile);
    await showToast({ style: Toast.Style.Success, title: "Opened in browser" });
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action title="Preview in Browser" onAction={preview} shortcut={{ modifiers: ["cmd"], key: "return" }} />
          <Action.CopyToClipboard title="Copy HTML" content={input} shortcut={{ modifiers: ["cmd"], key: "c" }} />
          <Action title="Clear" onAction={() => setInput("")} shortcut={{ modifiers: ["cmd"], key: "k" }} />
        </ActionPanel>
      }
    >
      <Form.TextArea
        id="input"
        title="HTML Input"
        placeholder="<h1>Hello World</h1>&#10;<p>Your HTML here...</p>"
        value={input}
        onChange={setInput}
        autoFocus
      />
      <Form.Description
        title="Tip"
        text="Press ⌘↩ to open preview in your default browser. If no <html> wrapper is detected, one will be added automatically."
      />
    </Form>
  );
}
