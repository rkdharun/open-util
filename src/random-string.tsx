import { Action, ActionPanel, Clipboard, Form, showToast, Toast } from "@raycast/api";
import { randomBytes } from "crypto";
import { useCallback, useMemo, useState } from "react";

const CHARSETS = {
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  digits: "0123456789",
  special: "!@#$%^&*()-_=+[]{}|;:,.<>?",
  hex: "0123456789abcdef",
  base64url: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_",
};

function generateRandom(length: number, charset: string): string {
  const bytes = randomBytes(length * 2);
  let result = "";
  let i = 0;
  while (result.length < length && i < bytes.length) {
    const idx = bytes[i] % charset.length;
    result += charset[idx];
    i++;
  }
  // fill remaining if needed
  while (result.length < length) {
    result += charset[Math.floor(Math.random() * charset.length)];
  }
  return result;
}

export default function RandomString() {
  const [length, setLength] = useState("32");
  const [includeLower, setIncludeLower] = useState(true);
  const [includeUpper, setIncludeUpper] = useState(true);
  const [includeDigits, setIncludeDigits] = useState(true);
  const [includeSpecial, setIncludeSpecial] = useState(false);
  const [useHex, setUseHex] = useState(false);
  const [useBase64url, setUseBase64url] = useState(false);
  const [count, setCount] = useState("5");
  const [seed, setSeed] = useState(0);

  const charset = useMemo(() => {
    if (useHex) return CHARSETS.hex;
    if (useBase64url) return CHARSETS.base64url;
    let c = "";
    if (includeLower) c += CHARSETS.lowercase;
    if (includeUpper) c += CHARSETS.uppercase;
    if (includeDigits) c += CHARSETS.digits;
    if (includeSpecial) c += CHARSETS.special;
    return c || CHARSETS.lowercase + CHARSETS.digits;
  }, [includeLower, includeUpper, includeDigits, includeSpecial, useHex, useBase64url, seed]);

  const strings = useMemo(() => {
    const n = Math.min(Math.max(parseInt(count, 10) || 5, 1), 100);
    const len = Math.min(Math.max(parseInt(length, 10) || 32, 1), 512);
    return Array.from({ length: n }, () => generateRandom(len, charset));
  }, [charset, length, count, seed]);

  const regenerate = useCallback(() => setSeed((s) => s + 1), []);

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.CopyToClipboard
            title="Copy First String"
            content={strings[0] ?? ""}
            shortcut={{ modifiers: ["cmd"], key: "return" }}
          />
          <Action
            title="Copy All Strings"
            onAction={async () => {
              await Clipboard.copy(strings.join("\n"));
              await showToast({ style: Toast.Style.Success, title: `Copied ${strings.length} strings` });
            }}
            shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
          />
          <Action title="Regenerate" onAction={regenerate} shortcut={{ modifiers: ["cmd"], key: "r" }} />
        </ActionPanel>
      }
    >
      <Form.TextField id="length" title="Length" value={length} onChange={setLength} placeholder="32" />
      <Form.TextField id="count" title="Count" value={count} onChange={setCount} placeholder="5" />
      <Form.Separator />
      <Form.Checkbox id="useLower" title="Charset" label="Lowercase (a-z)" value={includeLower} onChange={setIncludeLower} />
      <Form.Checkbox id="useUpper" title=" " label="Uppercase (A-Z)" value={includeUpper} onChange={setIncludeUpper} />
      <Form.Checkbox id="useDigits" title=" " label="Digits (0-9)" value={includeDigits} onChange={setIncludeDigits} />
      <Form.Checkbox id="useSpecial" title=" " label="Special (!@#$...)" value={includeSpecial} onChange={setIncludeSpecial} />
      <Form.Checkbox id="useHex" title=" " label="Hex only (0-9a-f)" value={useHex} onChange={setUseHex} />
      <Form.Checkbox id="useBase64url" title=" " label="Base64URL (A-Za-z0-9-_)" value={useBase64url} onChange={setUseBase64url} />
      <Form.Separator />
      <Form.TextArea
        id="output"
        title="Generated Strings"
        value={strings.join("\n")}
        onChange={() => undefined}
      />
    </Form>
  );
}
