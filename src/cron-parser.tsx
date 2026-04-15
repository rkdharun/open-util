import { Action, ActionPanel, Clipboard, Detail, Icon, List } from "@raycast/api";
import cronstrue from "cronstrue";
import { useEffect, useMemo, useState } from "react";

// Common cron presets
const PRESETS = [
  { label: "Every minute", value: "* * * * *" },
  { label: "Every 5 minutes", value: "*/5 * * * *" },
  { label: "Every 15 minutes", value: "*/15 * * * *" },
  { label: "Every 30 minutes", value: "*/30 * * * *" },
  { label: "Every hour", value: "0 * * * *" },
  { label: "Every 6 hours", value: "0 */6 * * *" },
  { label: "Every 12 hours", value: "0 */12 * * *" },
  { label: "Daily at midnight", value: "0 0 * * *" },
  { label: "Daily at noon", value: "0 12 * * *" },
  { label: "Weekly (Sunday midnight)", value: "0 0 * * 0" },
  { label: "Monthly (1st, midnight)", value: "0 0 1 * *" },
  { label: "Yearly (Jan 1st)", value: "0 0 1 1 *" },
  { label: "Weekdays only (midnight)", value: "0 0 * * 1-5" },
  { label: "Weekends only (midnight)", value: "0 0 * * 6,0" },
];

interface CronField {
  name: string;
  value: string;
  description: string;
  allowed: string;
}

function parseCronFields(expr: string): CronField[] {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5 && parts.length !== 6) return [];

  const fields6 = parts.length === 6;
  const offset = fields6 ? 1 : 0;

  const defs: CronField[] = [
    { name: "Minute", value: parts[offset], description: "0-59", allowed: "0-59, */n, ranges" },
    { name: "Hour", value: parts[offset + 1], description: "0-23", allowed: "0-23, */n, ranges" },
    { name: "Day of Month", value: parts[offset + 2], description: "1-31", allowed: "1-31, */n, ?" },
    { name: "Month", value: parts[offset + 3], description: "1-12 or JAN-DEC", allowed: "1-12, JAN-DEC" },
    { name: "Day of Week", value: parts[offset + 4], description: "0-7 or SUN-SAT", allowed: "0-7, SUN-SAT, ?" },
  ];

  if (fields6) {
    defs.unshift({ name: "Second", value: parts[0], description: "0-59", allowed: "0-59, */n" });
  }

  return defs;
}

function getNextRuns(expr: string, count = 5): string[] {
  try {
    const parts = expr.trim().split(/\s+/);
    if (parts.length !== 5) return ["(requires 5-field expression)"];

    const [minPart, hourPart, domPart, monPart, dowPart] = parts;
    const results: string[] = [];

    // Start from next minute
    const now = new Date();
    now.setSeconds(0, 0);
    let d = new Date(now.getTime() + 60000);

    // Cap search at 4 years worth of minutes to avoid infinite loop
    const MAX_ITERATIONS = 365 * 24 * 60 * 4;
    let iterations = 0;

    while (results.length < count && iterations < MAX_ITERATIONS) {
      iterations++;

      const min = d.getMinutes();
      const hour = d.getHours();
      const dom = d.getDate();
      const mon = d.getMonth() + 1; // 1-based
      const dow = d.getDay();       // 0=Sun

      // Month mismatch — jump to first minute of next month to skip days of searching
      if (!matchField(monPart, mon, 1, 12)) {
        d.setMonth(d.getMonth() + 1, 1);
        d.setHours(0, 0, 0, 0);
        continue;
      }

      // Day-of-month or day-of-week mismatch — jump to next day
      if (!matchField(domPart, dom, 1, 31) || !matchField(dowPart, dow, 0, 7)) {
        d = new Date(d.getTime() + 24 * 60 * 60 * 1000);
        d.setHours(0, 0, 0, 0);
        continue;
      }

      // Hour mismatch — jump to next hour
      if (!matchField(hourPart, hour, 0, 23)) {
        d = new Date(d.getTime() + 60 * 60 * 1000);
        d.setMinutes(0, 0, 0);
        continue;
      }

      if (matchField(minPart, min, 0, 59)) {
        results.push(d.toLocaleString());
      }

      d = new Date(d.getTime() + 60000);
    }

    return results.length > 0 ? results : ["No matches found in the next 4 years"];
  } catch {
    return [];
  }
}

function matchField(field: string, value: number, min: number, max: number): boolean {
  if (field === "*") return true;
  for (const part of field.split(",")) {
    if (part.includes("/")) {
      const [range, step] = part.split("/");
      const stepNum = parseInt(step, 10);
      const start = range === "*" ? min : parseInt(range.split("-")[0], 10);
      if (!isNaN(stepNum) && (value - start) % stepNum === 0 && value >= start) return true;
    } else if (part.includes("-")) {
      const [lo, hi] = part.split("-").map(Number);
      if (value >= lo && value <= hi) return true;
    } else {
      if (parseInt(part, 10) === value) return true;
    }
  }
  return false;
}

export default function CronParser() {
  const [input, setInput] = useState("");
  const [showPresets, setShowPresets] = useState(true);

  useEffect(() => {
    Clipboard.readText().then((t) => {
      if (t && /^[\d*,/\-\s]+$/.test(t.trim())) {
        setInput(t.trim());
        setShowPresets(false);
      }
    });
  }, []);

  const { description, fields, nextRuns, error } = useMemo(() => {
    if (!input.trim()) return { description: "", fields: [], nextRuns: [], error: null };
    try {
      const desc = cronstrue.toString(input.trim(), { verbose: true, throwExceptionOnParseError: true });
      const fields = parseCronFields(input.trim());
      const nextRuns = getNextRuns(input.trim());
      return { description: desc, fields, nextRuns, error: null };
    } catch (e) {
      return { description: "", fields: [], nextRuns: [], error: e instanceof Error ? e.message : String(e) };
    }
  }, [input]);

  const markdown = useMemo(() => {
    if (!input && showPresets) return "## Common Cron Presets\nSelect a preset from the list below.";
    if (error) return `## ❌ Parse Error\n\`\`\`\n${error}\n\`\`\``;
    if (!input) return "## Cron Job Parser\nEnter a cron expression (e.g. `*/5 * * * *`)";

    const lines = [
      `## \`${input}\``,
      "",
      `### ${description}`,
      "",
      "### Fields",
      "| Field | Value | Allowed |",
      "| --- | --- | --- |",
      ...fields.map((f) => `| ${f.name} | \`${f.value}\` | ${f.allowed} |`),
      "",
    ];

    if (nextRuns.length > 0) {
      lines.push("### Next Runs");
      nextRuns.forEach((r, i) => lines.push(`${i + 1}. ${r}`));
    }

    return lines.join("\n");
  }, [input, description, fields, nextRuns, error, showPresets]);

  if (showPresets && !input) {
    return (
      <List
        searchBarPlaceholder="Enter cron expression or select a preset..."
        onSearchTextChange={(t) => {
          setInput(t);
          if (t) setShowPresets(false);
        }}
      >
        <List.Section title="Common Presets">
          {PRESETS.map((p) => (
            <List.Item
              key={p.value}
              title={p.label}
              subtitle={p.value}
              accessories={[{ text: p.value }]}
              actions={
                <ActionPanel>
                  <Action
                    title="Use This Expression"
                    onAction={() => {
                      setInput(p.value);
                      setShowPresets(false);
                    }}
                  />
                  <Action.CopyToClipboard title="Copy Expression" content={p.value} />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      </List>
    );
  }

  return (
    <Detail
      markdown={markdown}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard title="Copy Description" content={description} />
          <Action title="Show Presets" icon={Icon.List} onAction={() => { setInput(""); setShowPresets(true); }} />
        </ActionPanel>
      }
      metadata={
        input && !error ? (
          <Detail.Metadata>
            <Detail.Metadata.Label title="Expression" text={input} />
            <Detail.Metadata.Label title="Description" text={description} />
            {fields.map((f) => (
              <Detail.Metadata.Label key={f.name} title={f.name} text={f.value} />
            ))}
          </Detail.Metadata>
        ) : undefined
      }
    />
  );
}
