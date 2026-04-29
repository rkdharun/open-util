import { Action, ActionPanel, Clipboard, Detail, Form, Icon, useNavigation } from "@raycast/api";
import { createHmac } from "crypto";
import { useState } from "react";

type Encoding = "hex" | "base64";

interface SignatureResult {
  message: string;
  hex: string;
  base64: string;
}

function computeHmac(message: string, secret: string): SignatureResult {
  return {
    message,
    hex: createHmac("sha256", secret).update(message).digest("hex"),
    base64: createHmac("sha256", secret).update(message).digest("base64"),
  };
}

function ResultView({ result, secretKey }: { result: SignatureResult; secretKey: string }) {
  const md = `
## HMAC-SHA256 Signature

| Field | Value |
|-------|-------|
| **Algorithm** | HMAC-SHA256 |
| **Message** | \`${result.message.length > 80 ? result.message.slice(0, 80) + "…" : result.message}\` |
| **Secret Key** | \`${"•".repeat(Math.min(secretKey.length, 20))}\` (${secretKey.length} chars) |

---

### Hex
\`\`\`
${result.hex}
\`\`\`

### Base64
\`\`\`
${result.base64}
\`\`\`
`;

  return (
    <Detail
      navigationTitle="HMAC-SHA256 Result"
      markdown={md}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard title="Copy Hex Signature" content={result.hex} />
          <Action.CopyToClipboard
            title="Copy Base64 Signature"
            content={result.base64}
            shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
          />
          <Action.CopyToClipboard
            title="Copy Both"
            content={`Hex: ${result.hex}\nBase64: ${result.base64}`}
            shortcut={{ modifiers: ["cmd", "opt"], key: "c" }}
          />
          <Action.Paste title="Paste Hex Signature" content={result.hex} shortcut={{ modifiers: ["cmd"], key: "v" }} />
        </ActionPanel>
      }
    />
  );
}

export default function Sha256Hmac() {
  const { push } = useNavigation();
  const [message, setMessage] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [messageError, setMessageError] = useState<string | undefined>();
  const [keyError, setKeyError] = useState<string | undefined>();

  function handleSubmit() {
    let valid = true;
    if (!message.trim()) {
      setMessageError("Message is required");
      valid = false;
    } else {
      setMessageError(undefined);
    }
    if (!secretKey.trim()) {
      setKeyError("Secret key is required");
      valid = false;
    } else {
      setKeyError(undefined);
    }
    if (!valid) return;

    const result = computeHmac(message, secretKey);
    push(<ResultView result={result} secretKey={secretKey} />);
  }

  async function handlePasteMessage() {
    const text = await Clipboard.readText();
    if (text) setMessage(text);
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Generate HMAC-SHA256" icon={Icon.Lock} onSubmit={handleSubmit} />
          <Action title="Paste from Clipboard" icon={Icon.Clipboard} onAction={handlePasteMessage} shortcut={{ modifiers: ["cmd", "shift"], key: "v" }} />
        </ActionPanel>
      }
    >
      <Form.TextArea
        id="message"
        title="Message"
        placeholder="Enter the message to sign"
        value={message}
        onChange={setMessage}
        error={messageError}
      />
      <Form.PasswordField
        id="secretKey"
        title="Secret Key"
        placeholder="Enter the HMAC secret key"
        value={secretKey}
        onChange={setSecretKey}
        error={keyError}
      />
      <Form.Description title="Algorithm" text="HMAC-SHA256 (RFC 2104)" />
    </Form>
  );
}
