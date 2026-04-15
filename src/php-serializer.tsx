import { Action, ActionPanel, Clipboard, Form } from "@raycast/api";
import { useEffect, useMemo, useState } from "react";

type Mode = "serialize" | "unserialize" | "to-json" | "from-json";

// PHP serialize/unserialize implementation
function phpSerialize(value: unknown): string {
  if (value === null) return "N;";
  if (typeof value === "boolean") return `b:${value ? 1 : 0};`;
  if (typeof value === "number") {
    if (Number.isInteger(value)) return `i:${value};`;
    return `d:${value};`;
  }
  if (typeof value === "string") return `s:${Buffer.byteLength(value, "utf8")}:"${value}";`;
  if (Array.isArray(value)) {
    const items = value.map((v, i) => `${phpSerialize(i)}${phpSerialize(v)}`).join("");
    return `a:${value.length}:{${items}}`;
  }
  if (typeof value === "object" && value !== null) {
    const entries = Object.entries(value as Record<string, unknown>);
    const items = entries.map(([k, v]) => `${phpSerialize(k)}${phpSerialize(v)}`).join("");
    return `a:${entries.length}:{${items}}`;
  }
  return "N;";
}

function phpUnserialize(str: string): unknown {
  let pos = 0;

  function readValue(): unknown {
    const type = str[pos];
    pos += 2; // skip type and ':'

    switch (type) {
      case "N": pos--; return null; // N; — pos already at ';', advance past it
      case "b": {
        const val = str[pos] === "1";
        pos += 2; // skip digit and ';'
        return val;
      }
      case "i": {
        const end = str.indexOf(";", pos);
        const val = parseInt(str.slice(pos, end), 10);
        pos = end + 1;
        return val;
      }
      case "d": {
        const end = str.indexOf(";", pos);
        const val = parseFloat(str.slice(pos, end));
        pos = end + 1;
        return val;
      }
      case "s": {
        const colonIdx = str.indexOf(":", pos);
        const len = parseInt(str.slice(pos, colonIdx), 10);
        pos = colonIdx + 2; // skip : and "
        const val = str.slice(pos, pos + len);
        pos += len + 2; // skip closing ";
        return val;
      }
      case "a": {
        const colonIdx = str.indexOf(":", pos);
        const count = parseInt(str.slice(pos, colonIdx), 10);
        pos = colonIdx + 2; // skip : and {
        const arr: unknown[] = [];
        const obj: Record<string, unknown> = {};
        let hasStringKey = false;
        for (let i = 0; i < count; i++) {
          const key = readValue();
          const val = readValue();
          if (typeof key === "string") {
            obj[key] = val;
            hasStringKey = true;
          } else {
            arr[key as number] = val;
            obj[String(key)] = val;
          }
        }
        pos++; // skip }
        return hasStringKey ? obj : arr;
      }
      default:
        throw new Error(`Unknown PHP serialize type: '${type}' at position ${pos}`);
    }
  }

  try {
    return readValue();
  } catch (e) {
    throw e;
  }
}

export default function PhpSerializer() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("unserialize");

  useEffect(() => {
    Clipboard.readText().then((t) => {
      if (!t) return;
      // Detect PHP serialized format
      if (/^[abids]:/.test(t.trim()) || t.trim() === "N;") {
        setMode("unserialize");
        setInput(t.trim());
      } else {
        try {
          JSON.parse(t.trim());
          setMode("serialize");
          setInput(t.trim());
        } catch {
          setInput(t.trim());
        }
      }
    });
  }, []);

  const output = useMemo(() => {
    if (!input.trim()) return "";
    try {
      switch (mode) {
        case "serialize": {
          const obj = JSON.parse(input);
          return phpSerialize(obj);
        }
        case "unserialize": {
          const obj = phpUnserialize(input);
          return JSON.stringify(obj, null, 2);
        }
        case "to-json": {
          const obj = phpUnserialize(input);
          return JSON.stringify(obj, null, 2);
        }
        case "from-json": {
          const obj = JSON.parse(input);
          return phpSerialize(obj);
        }
      }
    } catch (e) {
      return `Error: ${e instanceof Error ? e.message : String(e)}`;
    }
  }, [input, mode]);

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
        <Form.Dropdown.Item value="serialize" title="JSON → PHP Serialize" />
        <Form.Dropdown.Item value="unserialize" title="PHP Unserialize → JSON" />
      </Form.Dropdown>
      <Form.TextArea
        id="input"
        title="Input"
        placeholder={mode === "serialize" ? '{"key": "value"}' : 'a:1:{s:3:"key";s:5:"value";}'}
        value={input}
        onChange={setInput}
      />
      <Form.TextArea id="output" title="Output" value={output} onChange={() => undefined} />
    </Form>
  );
}
