import { Clipboard } from "@raycast/api";
import { useEffect, useState } from "react";

/** Read clipboard text on mount and return it */
export function useClipboardText(): [string, boolean] {
  const [text, setText] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Clipboard.readText().then((t) => {
      setText(t ?? "");
      setLoaded(true);
    });
  }, []);

  return [text, loaded];
}

/** Safely run a transform, returning an error string on failure */
export function safeTransform(fn: () => string): string {
  try {
    return fn();
  } catch (e) {
    return `Error: ${e instanceof Error ? e.message : String(e)}`;
  }
}

/** Format bytes to human-readable */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
