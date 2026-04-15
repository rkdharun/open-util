import { Action, ActionPanel, Clipboard, Detail, Form, open, showToast, Toast, useNavigation } from "@raycast/api";
import QRCode from "qrcode";
import { writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { useEffect, useState } from "react";

type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";

function QrCodeView({ text, ecLevel }: { text: string; ecLevel: ErrorCorrectionLevel }) {
  const [qrText, setQrText] = useState("Generating...");
  const [svgPath, setSvgPath] = useState<string | null>(null);

  useEffect(() => {
    // Generate ASCII QR code for display
    QRCode.toString(text, { type: "terminal", errorCorrectionLevel: ecLevel, small: true })
      .then((t) => setQrText(t))
      .catch((e) => setQrText(`Error: ${e.message}`));

    // Generate SVG for saving
    QRCode.toString(text, { type: "svg", errorCorrectionLevel: ecLevel })
      .then((svg) => {
        const path = join(tmpdir(), `devutils-qr-${Date.now()}.svg`);
        writeFileSync(path, svg, "utf8");
        setSvgPath(path);
      })
      .catch(() => null);
  }, [text, ecLevel]);

  const markdown = `## QR Code\n\n**Content**: ${text}\n\n\`\`\`\n${qrText}\n\`\`\``;

  return (
    <Detail
      markdown={markdown}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard title="Copy Content" content={text} shortcut={{ modifiers: ["cmd"], key: "c" }} />
          {svgPath && (
            <Action
              title="Open SVG in Browser"
              onAction={async () => {
                if (svgPath) {
                  await open(svgPath);
                }
              }}
              shortcut={{ modifiers: ["cmd"], key: "o" }}
            />
          )}
          {svgPath && (
            <Action.CopyToClipboard
              title="Copy SVG Path"
              content={svgPath}
              shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
            />
          )}
        </ActionPanel>
      }
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label title="Content" text={text.slice(0, 50) + (text.length > 50 ? "…" : "")} />
          <Detail.Metadata.Label title="Length" text={`${text.length} characters`} />
          <Detail.Metadata.Label title="Error Correction" text={ecLevel} />
        </Detail.Metadata>
      }
    />
  );
}

export default function QrCodeGenerator() {
  const [input, setInput] = useState("");
  const [ecLevel, setEcLevel] = useState<ErrorCorrectionLevel>("M");
  const { push } = useNavigation();

  useEffect(() => {
    Clipboard.readText().then((t) => t && setInput(t));
  }, []);

  async function generate() {
    if (!input.trim()) {
      await showToast({ style: Toast.Style.Failure, title: "Please enter text first" });
      return;
    }
    push(<QrCodeView text={input} ecLevel={ecLevel} />);
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action title="Generate QR Code" onAction={generate} shortcut={{ modifiers: ["cmd"], key: "return" }} />
          <Action title="Clear" onAction={() => setInput("")} shortcut={{ modifiers: ["cmd"], key: "k" }} />
        </ActionPanel>
      }
    >
      <Form.TextArea
        id="input"
        title="Content"
        placeholder="Enter URL, text, or data to encode..."
        value={input}
        onChange={setInput}
        autoFocus
      />
      <Form.Dropdown
        id="ecLevel"
        title="Error Correction"
        value={ecLevel}
        onChange={(v) => setEcLevel(v as ErrorCorrectionLevel)}
      >
        <Form.Dropdown.Item value="L" title="L — Low (7% recovery)" />
        <Form.Dropdown.Item value="M" title="M — Medium (15% recovery)" />
        <Form.Dropdown.Item value="Q" title="Q — Quartile (25% recovery)" />
        <Form.Dropdown.Item value="H" title="H — High (30% recovery)" />
      </Form.Dropdown>
      <Form.Description
        title="Tip"
        text="Press ⌘↩ to generate QR code. Higher error correction = larger code but more resilient."
      />
    </Form>
  );
}
