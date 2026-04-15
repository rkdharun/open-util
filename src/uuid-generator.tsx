import { Action, ActionPanel, Clipboard, Icon, List, showToast, Toast } from "@raycast/api";
import { nanoid } from "nanoid";
import { ulid } from "ulid";
import { useCallback, useState } from "react";
import { v1 as uuidv1, v4 as uuidv4 } from "uuid";

interface IdItem {
  id: string;
  type: string;
  value: string;
}

function generateIds(): IdItem[] {
  return [
    { id: "uuid-v4-1", type: "UUID v4", value: uuidv4() },
    { id: "uuid-v4-2", type: "UUID v4", value: uuidv4() },
    { id: "uuid-v4-3", type: "UUID v4", value: uuidv4() },
    { id: "uuid-v4-upper-1", type: "UUID v4 (uppercase)", value: uuidv4().toUpperCase() },
    { id: "uuid-v4-upper-2", type: "UUID v4 (uppercase)", value: uuidv4().toUpperCase() },
    { id: "uuid-v1-1", type: "UUID v1 (time-based)", value: uuidv1() },
    { id: "uuid-v1-2", type: "UUID v1 (time-based)", value: uuidv1() },
    { id: "ulid-1", type: "ULID", value: ulid() },
    { id: "ulid-2", type: "ULID", value: ulid() },
    { id: "ulid-3", type: "ULID", value: ulid() },
    { id: "nanoid-1", type: "Nano ID (21 chars)", value: nanoid() },
    { id: "nanoid-2", type: "Nano ID (21 chars)", value: nanoid() },
    { id: "nanoid-3", type: "Nano ID (21 chars)", value: nanoid() },
    { id: "nanoid-short-1", type: "Nano ID (10 chars)", value: nanoid(10) },
    { id: "nanoid-short-2", type: "Nano ID (10 chars)", value: nanoid(10) },
  ];
}

export default function UuidGenerator() {
  const [ids, setIds] = useState<IdItem[]>(generateIds);

  const regenerate = useCallback(() => {
    setIds(generateIds());
  }, []);

  // Group by type
  const grouped = ids.reduce<Record<string, IdItem[]>>((acc, item) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type].push(item);
    return acc;
  }, {});

  return (
    <List
      searchBarPlaceholder="Filter IDs..."
      actions={
        <ActionPanel>
          <Action title="Regenerate All" icon={Icon.ArrowClockwise} onAction={regenerate} />
        </ActionPanel>
      }
    >
      {Object.entries(grouped).map(([type, items]) => (
        <List.Section key={type} title={type}>
          {items.map((item) => (
            <List.Item
              key={item.id}
              title={item.value}
              subtitle={item.type}
              actions={
                <ActionPanel>
                  <Action.CopyToClipboard title="Copy" content={item.value} />
                  <Action title="Regenerate All" icon={Icon.ArrowClockwise} onAction={regenerate} shortcut={{ modifiers: ["cmd"], key: "r" }} />
                  <Action
                    title="Copy 10 UUIDs"
                    onAction={async () => {
                      const batch = Array.from({ length: 10 }, () => uuidv4());
                      await Clipboard.copy(batch.join("\n"));
                      await showToast({ style: Toast.Style.Success, title: "Copied 10 UUIDs" });
                    }}
                    shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
                  />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      ))}
    </List>
  );
}
