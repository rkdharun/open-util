import { Action, ActionPanel, Clipboard, Form } from "@raycast/api";
import { useEffect, useMemo, useState } from "react";

type Mode = "ascii-to-hex" | "hex-to-ascii";

export default function HexAscii() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("ascii-to-hex");
  const [separator, setSeparator] = useState(" ");

  useEffect(() => {
    Clipboard.readText().then((t) => t && setInput(t));
  }, []);

  const output = useMemo(() => {
    if (!input) return "";
    try {
      if (mode === "ascii-to-hex") {
        return input
          .split("")
          .map((c) => c.charCodeAt(0).toString(16).padStart(2, "0"))
          .join(separator);
      } else {
        const clean = input.replace(/\s+/g, " ").trim();
        const parts = separator === " " ? clean.split(/\s+/) : clean.split(separator);
        return parts
          .map((hex) => {
            const code = parseInt(hex.trim(), 16);
            if (isNaN(code)) throw new Error(`Invalid hex value: "${hex}"`);
            return String.fromCharCode(code);
          })
          .join("");
      }
    } catch (e) {
      return `Error: ${e instanceof Error ? e.message : String(e)}`;
    }
  }, [input, mode, separator]);

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.CopyToClipboard title="Copy Output" content={output} shortcut={{ modifiers: ["cmd"], key: "return" }} />
          <Action title="Swap Input / Output" onAction={() => setInput(output)} shortcut={{ modifiers: ["cmd"], key: "s" }} />
          <Action title="Clear" onAction={() => setInput("")} shortcut={{ modifiers: ["cmd"], key: "k" }} />
        </ActionPanel>
      }
    >
      <Form.Dropdown id="mode" title="Mode" value={mode} onChange={(v) => setMode(v as Mode)}>
        <Form.Dropdown.Item value="ascii-to-hex" title="ASCII → Hex" />
        <Form.Dropdown.Item value="hex-to-ascii" title="Hex → ASCII" />
      </Form.Dropdown>
      <Form.Dropdown id="separator" title="Separator" value={separator} onChange={setSeparator}>
        <Form.Dropdown.Item value=" " title="Space" />
        <Form.Dropdown.Item value="" title="None" />
        <Form.Dropdown.Item value="-" title="Dash" />
        <Form.Dropdown.Item value=":" title="Colon" />
      </Form.Dropdown>
      <Form.TextArea id="input" title="Input" placeholder="Enter ASCII text or hex values..." value={input} onChange={setInput} />
      <Form.TextArea id="output" title="Output" value={output} onChange={() => undefined} />
    </Form>
  );
}
