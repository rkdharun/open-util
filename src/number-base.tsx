import { Action, ActionPanel, Clipboard, Icon, List } from "@raycast/api";
import { useEffect, useMemo, useState } from "react";

interface BaseConversion {
  id: string;
  label: string;
  prefix: string;
  base: number;
  value: string;
}

function convert(input: string, fromBase: number): BaseConversion[] | null {
  const clean = input.trim().replace(/\s/g, "");
  if (!clean) return null;

  let decimal: number;
  try {
    decimal = parseInt(clean, fromBase);
    if (isNaN(decimal)) return null;
  } catch {
    return null;
  }

  const isBigNum = decimal > Number.MAX_SAFE_INTEGER;

  return [
    { id: "dec", label: "Decimal (Base 10)", prefix: "", base: 10, value: decimal.toString(10) },
    { id: "bin", label: "Binary (Base 2)", prefix: "0b", base: 2, value: decimal.toString(2) },
    { id: "oct", label: "Octal (Base 8)", prefix: "0o", base: 8, value: decimal.toString(8) },
    { id: "hex", label: "Hexadecimal (Base 16)", prefix: "0x", base: 16, value: decimal.toString(16).toUpperCase() },
    { id: "hex-lower", label: "Hexadecimal (lowercase)", prefix: "0x", base: 16, value: decimal.toString(16) },
    { id: "base32", label: "Base 32", prefix: "", base: 32, value: decimal.toString(32).toUpperCase() },
    { id: "base36", label: "Base 36 (alphanumeric)", prefix: "", base: 36, value: decimal.toString(36).toUpperCase() },
    { id: "base64", label: "Base 64 (numeric only)", prefix: "", base: 64, value: decimal.toString(64) },
    {
      id: "bin-grouped",
      label: "Binary (grouped by 4)",
      prefix: "",
      base: 2,
      value: decimal.toString(2).padStart(Math.ceil(decimal.toString(2).length / 4) * 4, "0").replace(/(.{4})/g, "$1 ").trim(),
    },
    {
      id: "hex-spaced",
      label: "Hex (grouped by 2)",
      prefix: "",
      base: 16,
      value: decimal.toString(16).toUpperCase().padStart(Math.ceil(decimal.toString(16).length / 2) * 2, "0").replace(/(.{2})/g, "$1 ").trim(),
    },
    { id: "neg", label: "Negative (two's complement, 32-bit)", prefix: "", base: 10, value: ((decimal | 0) >>> 0).toString() + ` (${decimal | 0})` },
  ];
}

const BASE_OPTIONS = [
  { label: "Decimal (10)", value: "10" },
  { label: "Binary (2)", value: "2" },
  { label: "Octal (8)", value: "8" },
  { label: "Hexadecimal (16)", value: "16" },
];

export default function NumberBase() {
  const [input, setInput] = useState("");
  const [fromBase, setFromBase] = useState("10");

  useEffect(() => {
    Clipboard.readText().then((t) => {
      if (!t) return;
      const clean = t.trim();
      if (/^-?\d+$/.test(clean)) { setInput(clean); setFromBase("10"); }
      else if (/^0b[01]+$/i.test(clean)) { setInput(clean.slice(2)); setFromBase("2"); }
      else if (/^0x[\da-f]+$/i.test(clean)) { setInput(clean.slice(2)); setFromBase("16"); }
      else if (/^0o[0-7]+$/i.test(clean)) { setInput(clean.slice(2)); setFromBase("8"); }
    });
  }, []);

  const conversions = useMemo(() => convert(input, parseInt(fromBase, 10)), [input, fromBase]);

  return (
    <List
      searchBarPlaceholder="Enter a number to convert..."
      onSearchTextChange={setInput}
      searchText={input}
      searchBarAccessory={
        <List.Dropdown tooltip="Input Base" value={fromBase} onChange={setFromBase}>
          {BASE_OPTIONS.map((o) => (
            <List.Dropdown.Item key={o.value} value={o.value} title={o.label} />
          ))}
        </List.Dropdown>
      }
    >
      {!conversions ? (
        <List.EmptyView title="Enter a number to convert" icon={Icon.Calculator} description="Supports decimal, binary, octal, hex, and more" />
      ) : (
        <List.Section title={`Conversions for: ${input} (base ${fromBase})`}>
          {conversions.map((c) => (
            <List.Item
              key={c.id}
              title={c.value}
              subtitle={c.label}
              accessories={[{ text: c.label }]}
              actions={
                <ActionPanel>
                  <Action.CopyToClipboard title={`Copy ${c.label}`} content={c.value.replace(/\s/g, "")} />
                  <Action.CopyToClipboard
                    title="Copy with Prefix"
                    content={`${c.prefix}${c.value}`}
                    shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
                  />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      )}
    </List>
  );
}
