import { Action, ActionPanel, Clipboard, Detail, Icon } from "@raycast/api";
import { useEffect, useMemo, useState } from "react";

interface JwtParts {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
  error: string | null;
}

function decodeJwt(token: string): JwtParts {
  const parts = token.trim().split(".");
  if (parts.length !== 3) {
    return { header: {}, payload: {}, signature: "", error: "Invalid JWT: must have 3 parts separated by dots" };
  }

  try {
    const decodeBase64Url = (s: string) => {
      const padded = s.replace(/-/g, "+").replace(/_/g, "/");
      const pad = padded.length % 4;
      const b64 = pad ? padded + "=".repeat(4 - pad) : padded;
      return Buffer.from(b64, "base64").toString("utf8");
    };

    const header = JSON.parse(decodeBase64Url(parts[0]));
    const payload = JSON.parse(decodeBase64Url(parts[1]));
    return { header, payload, signature: parts[2], error: null };
  } catch (e) {
    return { header: {}, payload: {}, signature: "", error: e instanceof Error ? e.message : String(e) };
  }
}

function formatTimestamp(val: unknown): string {
  if (typeof val !== "number") return String(val);
  const d = new Date(val * 1000);
  return `${val} (${d.toISOString()} · ${getRelative(d)})`;
}

function getRelative(d: Date): string {
  const diff = Date.now() - d.getTime();
  const future = diff < 0;
  const abs = Math.abs(diff);
  const s = Math.floor(abs / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const day = Math.floor(h / 24);

  let str: string;
  if (day > 0) str = `${day}d`;
  else if (h > 0) str = `${h}h`;
  else if (m > 0) str = `${m}m`;
  else str = `${s}s`;

  return future ? `in ${str}` : `${str} ago`;
}

function buildMarkdown(token: string, parts: JwtParts): string {
  if (!token) return "## JWT Debugger\nPaste a JWT token to decode it.";
  if (parts.error) return `## ❌ Error\n${parts.error}`;

  const { header, payload, signature } = parts;

  // Check expiry
  const exp = payload.exp as number | undefined;
  const iat = payload.iat as number | undefined;
  const nbf = payload.nbf as number | undefined;
  const now = Math.floor(Date.now() / 1000);
  const expired = exp && exp < now;
  const notYetValid = nbf && nbf > now;

  const lines: string[] = [
    `## JWT Token`,
    expired ? "⚠️ **Token is EXPIRED**" : exp ? "✅ Token is valid (not expired)" : "",
    notYetValid ? "⚠️ **Token is not yet valid (nbf)**" : "",
    "",
    "### Header",
    "```json",
    JSON.stringify(header, null, 2),
    "```",
    "",
    "### Payload",
    "```json",
    JSON.stringify(payload, null, 2),
    "```",
    "",
    "### Signature",
    `\`${signature}\``,
    "",
    "### Claims",
    ...(iat ? [`- **iat** (Issued At): ${formatTimestamp(iat)}`] : []),
    ...(exp ? [`- **exp** (Expires At): ${formatTimestamp(exp)}${expired ? " ⚠️ EXPIRED" : ""}`] : []),
    ...(nbf ? [`- **nbf** (Not Before): ${formatTimestamp(nbf)}`] : []),
    ...(payload.sub ? [`- **sub** (Subject): ${payload.sub}`] : []),
    ...(payload.iss ? [`- **iss** (Issuer): ${payload.iss}`] : []),
    ...(payload.aud ? [`- **aud** (Audience): ${Array.isArray(payload.aud) ? (payload.aud as unknown[]).map(String).join(", ") : String(payload.aud)}`] : []),
    ...(payload.jti ? [`- **jti** (JWT ID): ${payload.jti}`] : []),
  ].filter((l) => l !== "");

  return lines.join("\n");
}

export default function JwtDebugger() {
  const [token, setToken] = useState("");

  useEffect(() => {
    Clipboard.readText().then((t) => {
      if (t && /^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/.test(t.trim())) {
        setToken(t.trim());
      }
    });
  }, []);

  const parts = useMemo(() => decodeJwt(token), [token]);
  const markdown = useMemo(() => buildMarkdown(token, parts), [token, parts]);

  return (
    <Detail
      markdown={markdown}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard
            title="Copy Header"
            content={JSON.stringify(parts.header, null, 2)}
            shortcut={{ modifiers: ["cmd"], key: "h" }}
          />
          <Action.CopyToClipboard
            title="Copy Payload"
            content={JSON.stringify(parts.payload, null, 2)}
            shortcut={{ modifiers: ["cmd"], key: "p" }}
          />
          <Action.CopyToClipboard title="Copy Full Token" content={token} />
          <Action
            title="Paste New Token"
            icon={Icon.Clipboard}
            onAction={async () => {
              const t = await Clipboard.readText();
              if (t) setToken(t.trim());
            }}
            shortcut={{ modifiers: ["cmd"], key: "v" }}
          />
        </ActionPanel>
      }
      metadata={
        !parts.error && token ? (
          <Detail.Metadata>
            <Detail.Metadata.Label title="Algorithm" text={String(parts.header.alg || "unknown")} />
            <Detail.Metadata.Label title="Type" text={String(parts.header.typ || "JWT")} />
            {parts.payload.iss ? <Detail.Metadata.Label title="Issuer" text={String(parts.payload.iss)} /> : null}
            {parts.payload.sub ? <Detail.Metadata.Label title="Subject" text={String(parts.payload.sub)} /> : null}
            {parts.payload.exp ? (
              <Detail.Metadata.Label
                title="Expires"
                text={new Date((parts.payload.exp as number) * 1000).toLocaleString()}
              />
            ) : null}
          </Detail.Metadata>
        ) : undefined
      }
    />
  );
}
