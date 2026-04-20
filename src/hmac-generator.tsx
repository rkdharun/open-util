import { Action, ActionPanel, Form, Icon, List, useNavigation } from "@raycast/api";
import { createHmac } from "crypto";
import { useMemo, useState } from "react";

const ALGORITHMS = ["sha256", "sha1", "sha512", "md5"] as const;
type Algorithm = (typeof ALGORITHMS)[number];

const LABELS: Record<Algorithm, string> = {
  sha256: "HMAC-SHA256",
  sha1: "HMAC-SHA1",
  sha512: "HMAC-SHA512",
  md5: "HMAC-MD5",
};

interface HmacResult {
  algo: Algorithm;
  label: string;
  signature: string;
}

function ResultList({
  message,
  secretKey,
  encoding,
}: {
  message: string;
  secretKey: string;
  encoding: "hex" | "base64";
}) {
  const [selectedEncoding, setSelectedEncoding] = useState<"hex" | "base64">(encoding);

  const recomputed = useMemo<HmacResult[]>(() => {
    if (!message || !secretKey) return [];
    return ALGORITHMS.map((algo) => {
      try {
        const signature = createHmac(algo, secretKey).update(message).digest(selectedEncoding);
        return { algo, label: LABELS[algo], signature };
      } catch {
        return { algo, label: LABELS[algo], signature: "(error)" };
      }
    });
  }, [message, secretKey, selectedEncoding]);

  return (
    <List
      navigationTitle="HMAC Signatures"
      searchBarAccessory={
        <List.Dropdown
          tooltip="Encoding"
          value={selectedEncoding}
          onChange={(v) => setSelectedEncoding(v as "hex" | "base64")}
        >
          <List.Dropdown.Item value="hex" title="Hex" />
          <List.Dropdown.Item value="base64" title="Base64" />
        </List.Dropdown>
      }
    >
      {recomputed.map((r) => (
        <List.Item
          key={r.algo}
          title={r.signature}
          subtitle={r.label}
          accessories={[{ text: r.label }]}
          actions={
            <ActionPanel>
              <Action.CopyToClipboard title={`Copy ${r.label} Signature`} content={r.signature} />
              <Action.CopyToClipboard
                title="Copy All Signatures"
                content={recomputed.map((x) => `${x.label}: ${x.signature}`).join("\n")}
                shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

export default function HmacGenerator() {
  const { push } = useNavigation();
  const [message, setMessage] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [encoding, setEncoding] = useState<"hex" | "base64">("hex");
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
    push(<ResultList message={message} secretKey={secretKey} encoding={encoding} />);
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Generate Signatures" icon={Icon.Lock} onSubmit={handleSubmit} />
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
      <Form.TextField
        id="secretKey"
        title="Secret Key"
        placeholder="Enter the HMAC secret key"
        value={secretKey}
        onChange={setSecretKey}
        error={keyError}
      />
      <Form.Dropdown id="encoding" title="Output Encoding" value={encoding} onChange={(v) => setEncoding(v as "hex" | "base64")}>
        <Form.Dropdown.Item value="hex" title="Hex" />
        <Form.Dropdown.Item value="base64" title="Base64" />
      </Form.Dropdown>
    </Form>
  );
}
