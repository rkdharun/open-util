import { Action, ActionPanel, Clipboard, Icon, List } from "@raycast/api";
import { useEffect, useMemo, useState } from "react";

interface UrlComponent {
  id: string;
  label: string;
  value: string;
}

function parseUrl(raw: string): { components: UrlComponent[]; error: string | null } {
  if (!raw.trim()) return { components: [], error: null };

  let urlStr = raw.trim();
  // Add protocol if missing
  if (!urlStr.includes("://")) urlStr = "https://" + urlStr;

  try {
    const url = new URL(urlStr);
    const components: UrlComponent[] = [
      { id: "full", label: "Full URL", value: urlStr },
      { id: "protocol", label: "Protocol", value: url.protocol.replace(":", "") },
      { id: "hostname", label: "Hostname", value: url.hostname },
      { id: "port", label: "Port", value: url.port || `(default: ${url.protocol === "https:" ? "443" : "80"})` },
      { id: "origin", label: "Origin", value: url.origin },
      { id: "pathname", label: "Path", value: url.pathname || "/" },
      { id: "search", label: "Query String", value: url.search || "(none)" },
      { id: "hash", label: "Hash / Fragment", value: url.hash || "(none)" },
      { id: "host", label: "Host (with port)", value: url.host },
      { id: "username", label: "Username", value: url.username || "(none)" },
      { id: "password", label: "Password", value: url.password || "(none)" },
    ];

    // Parse query params
    url.searchParams.forEach((value, key) => {
      components.push({ id: `param-${key}`, label: `Query: ${key}`, value });
    });

    return { components, error: null };
  } catch (e) {
    return { components: [], error: e instanceof Error ? e.message : String(e) };
  }
}

export default function UrlParser() {
  const [input, setInput] = useState("");

  useEffect(() => {
    Clipboard.readText().then((t) => {
      if (t && (t.startsWith("http") || t.startsWith("/"))) setInput(t.trim());
    });
  }, []);

  const { components, error } = useMemo(() => parseUrl(input), [input]);

  return (
    <List
      searchBarPlaceholder="Paste a URL to parse..."
      onSearchTextChange={setInput}
      searchText={input}
    >
      {error ? (
        <List.EmptyView title={`Error: ${error}`} icon={Icon.Warning} />
      ) : components.length === 0 ? (
        <List.EmptyView title="Paste a URL to parse its components" icon={Icon.Link} />
      ) : (
        <List.Section title="URL Components">
          {components.map((c) => (
            <List.Item
              key={c.id}
              title={c.value}
              subtitle={c.label}
              accessories={[{ text: c.label }]}
              actions={
                <ActionPanel>
                  <Action.CopyToClipboard title={`Copy ${c.label}`} content={c.value} />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      )}
    </List>
  );
}
