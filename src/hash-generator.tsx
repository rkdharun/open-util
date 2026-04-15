import { Action, ActionPanel, Clipboard, Icon, List } from "@raycast/api";
import { createHash } from "crypto";
import { useEffect, useMemo, useState } from "react";

const ALGORITHMS = ["md5", "sha1", "sha224", "sha256", "sha384", "sha512", "sha3-256", "sha3-512"] as const;
type Algorithm = (typeof ALGORITHMS)[number];

interface HashResult {
  algo: Algorithm;
  label: string;
  hash: string;
}

const LABELS: Record<Algorithm, string> = {
  md5: "MD5",
  sha1: "SHA-1",
  sha224: "SHA-224",
  sha256: "SHA-256",
  sha384: "SHA-384",
  sha512: "SHA-512",
  "sha3-256": "SHA3-256",
  "sha3-512": "SHA3-512",
};

export default function HashGenerator() {
  const [input, setInput] = useState("");
  const [encoding, setEncoding] = useState<"hex" | "base64">("hex");

  useEffect(() => {
    Clipboard.readText().then((t) => t && setInput(t));
  }, []);

  const hashes = useMemo<HashResult[]>(() => {
    if (!input) return [];
    return ALGORITHMS.map((algo) => {
      try {
        const hash = createHash(algo).update(input).digest(encoding);
        return { algo, label: LABELS[algo], hash };
      } catch {
        return { algo, label: LABELS[algo], hash: "(unsupported)" };
      }
    });
  }, [input, encoding]);

  return (
    <List
      searchBarPlaceholder="Type or paste text to hash..."
      onSearchTextChange={setInput}
      searchText={input}
      searchBarAccessory={
        <List.Dropdown tooltip="Encoding" onChange={(v) => setEncoding(v as "hex" | "base64")} value={encoding}>
          <List.Dropdown.Item value="hex" title="Hex" />
          <List.Dropdown.Item value="base64" title="Base64" />
        </List.Dropdown>
      }
    >
      {hashes.length === 0 ? (
        <List.EmptyView title="Enter text to generate hashes" icon={Icon.Lock} />
      ) : (
        hashes.map((h) => (
          <List.Item
            key={h.algo}
            title={h.hash}
            subtitle={h.label}
            accessories={[{ text: h.label }]}
            actions={
              <ActionPanel>
                <Action.CopyToClipboard title={`Copy ${h.label} Hash`} content={h.hash} />
                <Action.CopyToClipboard
                  title="Copy All Hashes"
                  content={hashes.map((x) => `${x.label}: ${x.hash}`).join("\n")}
                  shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
                />
              </ActionPanel>
            }
          />
        ))
      )}
    </List>
  );
}
