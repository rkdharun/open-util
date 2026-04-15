import { Action, ActionPanel, Clipboard, Icon, List, showToast, Toast } from "@raycast/api";
import { useEffect, useMemo, useState } from "react";

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Los_Angeles",
  "America/Chicago",
  "America/Denver",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Australia/Sydney",
  "Pacific/Auckland",
];

interface ConvertedTime {
  id: string;
  label: string;
  value: string;
}

function formatInZone(date: Date, tz: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short",
    }).format(date);
  } catch {
    return "(invalid timezone)";
  }
}

function parseInput(input: string): Date | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Try as Unix timestamp (seconds)
  const num = Number(trimmed);
  if (!isNaN(num) && trimmed.length <= 13) {
    // <= 10 digits = seconds, 11-13 = milliseconds
    return new Date(trimmed.length <= 10 ? num * 1000 : num);
  }

  // Try as date string
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) return d;

  return null;
}

export default function UnixTimestamp() {
  const [input, setInput] = useState("");

  useEffect(() => {
    Clipboard.readText().then((t) => {
      if (!t) return;
      const num = Number(t.trim());
      if (!isNaN(num) && t.trim().length <= 13) setInput(t.trim());
    });
  }, []);

  const date = useMemo(() => parseInput(input), [input]);
  const now = useMemo(() => new Date(), []);

  const items = useMemo<ConvertedTime[]>(() => {
    const d = date || now;
    const ts = d.getTime();
    const results: ConvertedTime[] = [
      { id: "unix-s", label: "Unix (seconds)", value: Math.floor(ts / 1000).toString() },
      { id: "unix-ms", label: "Unix (milliseconds)", value: ts.toString() },
      { id: "iso", label: "ISO 8601", value: d.toISOString() },
      { id: "utc", label: "UTC", value: d.toUTCString() },
      { id: "local", label: "Local", value: d.toLocaleString() },
      { id: "date-only", label: "Date Only", value: d.toISOString().split("T")[0] },
      { id: "time-only", label: "Time Only (UTC)", value: d.toISOString().split("T")[1].replace("Z", " UTC") },
      { id: "relative", label: "Relative", value: getRelative(d) },
    ];

    for (const tz of TIMEZONES) {
      results.push({ id: `tz-${tz}`, label: tz, value: formatInZone(d, tz) });
    }

    return results;
  }, [date, now, input]);

  function getRelative(d: Date): string {
    const diff = Date.now() - d.getTime();
    const abs = Math.abs(diff);
    const future = diff < 0;
    const s = Math.floor(abs / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const day = Math.floor(h / 24);
    const yr = Math.floor(day / 365);

    let str: string;
    if (yr > 0) str = `${yr} year${yr > 1 ? "s" : ""}`;
    else if (day > 0) str = `${day} day${day > 1 ? "s" : ""}`;
    else if (h > 0) str = `${h} hour${h > 1 ? "s" : ""}`;
    else if (m > 0) str = `${m} minute${m > 1 ? "s" : ""}`;
    else str = `${s} second${s !== 1 ? "s" : ""}`;

    return future ? `in ${str}` : `${str} ago`;
  }

  return (
    <List
      searchBarPlaceholder="Enter Unix timestamp or date string..."
      onSearchTextChange={setInput}
      searchText={input}
      actions={
        <ActionPanel>
          <Action
            title="Use Current Time"
            icon={Icon.Clock}
            onAction={async () => {
              const ts = Math.floor(Date.now() / 1000).toString();
              setInput(ts);
              await Clipboard.copy(ts);
              await showToast({ style: Toast.Style.Success, title: "Current timestamp copied" });
            }}
          />
        </ActionPanel>
      }
    >
      {date ? (
        <List.Section title={`Parsed: ${date.toISOString()}`}>
          {items.map((i) => (
            <List.Item
              key={i.id}
              title={i.value}
              subtitle={i.label}
              actions={
                <ActionPanel>
                  <Action.CopyToClipboard title={`Copy ${i.label}`} content={i.value} />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      ) : (
        <>
          <List.Section title="Current Time">
            {items.map((i) => (
              <List.Item
                key={i.id}
                title={i.value}
                subtitle={i.label}
                actions={
                  <ActionPanel>
                    <Action.CopyToClipboard title={`Copy ${i.label}`} content={i.value} />
                  </ActionPanel>
                }
              />
            ))}
          </List.Section>
        </>
      )}
    </List>
  );
}
