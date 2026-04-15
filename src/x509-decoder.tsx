import { Action, ActionPanel, Clipboard, Detail, Icon } from "@raycast/api";
import forge from "node-forge";
import { useEffect, useMemo, useState } from "react";

interface CertInfo {
  subject: Record<string, string>;
  issuer: Record<string, string>;
  validFrom: string;
  validTo: string;
  serialNumber: string;
  fingerprints: { sha1: string; sha256: string };
  subjectAltNames: string[];
  keyUsage: string[];
  extKeyUsage: string[];
  signatureAlgorithm: string;
  publicKeySize: number;
  publicKeyType: string;
  isCA: boolean;
  isSelfSigned: boolean;
  isExpired: boolean;
  version: number;
}

function getRdnValue(rdn: forge.pki.CertificateField[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const attr of rdn) {
    const name = String(attr.shortName || attr.name || attr.type || "");
    if (name) map[name] = attr.value as string;
  }
  return map;
}

function decodeCert(pem: string): { info: CertInfo | null; error: string | null } {
  if (!pem.trim()) return { info: null, error: null };

  let pemStr = pem.trim();
  if (!pemStr.includes("-----BEGIN")) {
    // Try to wrap raw base64
    pemStr = `-----BEGIN CERTIFICATE-----\n${pemStr}\n-----END CERTIFICATE-----`;
  }

  try {
    const cert = forge.pki.certificateFromPem(pemStr);

    const subject = getRdnValue(cert.subject.attributes);
    const issuer = getRdnValue(cert.issuer.attributes);

    // Fingerprints
    const der = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes();
    const md1 = forge.md.sha1.create();
    md1.update(der);
    const sha1 = (md1.digest().toHex().match(/.{2}/g) ?? []).join(":").toUpperCase();

    const md256 = forge.md.sha256.create();
    md256.update(der);
    const sha256 = (md256.digest().toHex().match(/.{2}/g) ?? []).join(":").toUpperCase();

    // SANs
    const sanExt = cert.getExtension("subjectAltName") as { altNames?: Array<{ type: number; value: string; ip?: string }> } | null;
    const subjectAltNames: string[] = [];
    if (sanExt?.altNames) {
      for (const alt of sanExt.altNames) {
        if (alt.type === 2) subjectAltNames.push(`DNS: ${alt.value}`);
        else if (alt.type === 7) subjectAltNames.push(`IP: ${alt.ip || alt.value}`);
        else subjectAltNames.push(alt.value);
      }
    }

    // Key usage
    const kuExt = cert.getExtension("keyUsage") as Record<string, boolean> | null;
    const keyUsage: string[] = [];
    if (kuExt) {
      const fields: (keyof typeof kuExt)[] = ["digitalSignature", "nonRepudiation", "keyEncipherment", "dataEncipherment", "keyAgreement", "keyCertSign", "cRLSign"];
      for (const f of fields) {
        if (kuExt[f]) keyUsage.push(String(f));
      }
    }

    const ekuExt = cert.getExtension("extKeyUsage") as Record<string, boolean> | null;
    const extKeyUsage: string[] = [];
    if (ekuExt) {
      const fields = ["serverAuth", "clientAuth", "codeSigning", "emailProtection", "timeStamping"];
      for (const f of fields) {
        if (ekuExt[f as keyof typeof ekuExt]) extKeyUsage.push(f);
      }
    }

    // Basic constraints
    const bcExt = cert.getExtension("basicConstraints") as { cA?: boolean } | null;
    const isCA = bcExt?.cA === true;

    const isSelfSigned = cert.isIssuer(cert);
    const isExpired = new Date(cert.validity.notAfter) < new Date();

    const pubKey = cert.publicKey as forge.pki.rsa.PublicKey;
    const keySize = pubKey.n ? pubKey.n.bitLength() : 0;

    const info: CertInfo = {
      subject,
      issuer,
      validFrom: cert.validity.notBefore.toISOString(),
      validTo: cert.validity.notAfter.toISOString(),
      serialNumber: cert.serialNumber,
      fingerprints: { sha1, sha256 },
      subjectAltNames,
      keyUsage,
      extKeyUsage,
      signatureAlgorithm: cert.siginfo?.algorithmOid || "unknown",
      publicKeySize: keySize,
      publicKeyType: "RSA",
      isCA,
      isSelfSigned,
      isExpired,
      version: cert.version + 1,
    };

    return { info, error: null };
  } catch (e) {
    return { info: null, error: e instanceof Error ? e.message : String(e) };
  }
}

function buildMarkdown(info: CertInfo | null, error: string | null): string {
  if (!info && !error) return "## X.509 Certificate Decoder\nPaste a PEM-encoded certificate to decode it.";
  if (error) return `## ❌ Error\n${error}`;
  if (!info) return "";

  const expiredBadge = info.isExpired ? " ⚠️ **EXPIRED**" : " ✅ Valid";

  return [
    `## Certificate Details${expiredBadge}`,
    "",
    "### Subject",
    `- **CN**: ${info.subject.CN || "(none)"}`,
    info.subject.O ? `- **O**: ${info.subject.O}` : "",
    info.subject.OU ? `- **OU**: ${info.subject.OU}` : "",
    info.subject.C ? `- **C**: ${info.subject.C}` : "",
    info.subject.ST ? `- **ST**: ${info.subject.ST}` : "",
    info.subject.L ? `- **L**: ${info.subject.L}` : "",
    "",
    "### Issuer",
    `- **CN**: ${info.issuer.CN || "(none)"}`,
    info.issuer.O ? `- **O**: ${info.issuer.O}` : "",
    "",
    "### Validity",
    `- **Not Before**: ${new Date(info.validFrom).toLocaleString()}`,
    `- **Not After**: ${new Date(info.validTo).toLocaleString()}${info.isExpired ? " ⚠️" : ""}`,
    "",
    "### Fingerprints",
    `- **SHA-1**: \`${info.fingerprints.sha1}\``,
    `- **SHA-256**: \`${info.fingerprints.sha256}\``,
    "",
    "### Key Info",
    `- **Type**: ${info.publicKeyType}`,
    `- **Size**: ${info.publicKeySize} bits`,
    `- **Version**: X.509 v${info.version}`,
    `- **Serial**: ${info.serialNumber}`,
    `- **Is CA**: ${info.isCA ? "Yes" : "No"}`,
    `- **Self-Signed**: ${info.isSelfSigned ? "Yes" : "No"}`,
    "",
    info.subjectAltNames.length > 0 ? "### Subject Alternative Names" : "",
    ...info.subjectAltNames.map((s) => `- ${s}`),
    "",
    info.keyUsage.length > 0 ? `### Key Usage\n${info.keyUsage.map((k) => `- ${k}`).join("\n")}` : "",
    info.extKeyUsage.length > 0 ? `### Extended Key Usage\n${info.extKeyUsage.map((k) => `- ${k}`).join("\n")}` : "",
  ].filter((l) => l !== "").join("\n");
}

export default function X509Decoder() {
  const [input, setInput] = useState("");
  const [showForm, setShowForm] = useState(true);

  useEffect(() => {
    Clipboard.readText().then((t) => {
      if (t && t.trim().startsWith("-----BEGIN CERTIFICATE")) {
        setInput(t.trim());
        setShowForm(false);
      }
    });
  }, []);

  const { info, error } = useMemo(() => decodeCert(input), [input]);
  const markdown = useMemo(() => buildMarkdown(info, error), [info, error]);

  if (!showForm && (info || error)) {
    return (
      <Detail
        markdown={markdown}
        actions={
          <ActionPanel>
            <Action title="Edit Certificate" icon={Icon.Pencil} onAction={() => setShowForm(true)} />
            {info && (
              <>
                <Action.CopyToClipboard title="Copy SHA-256" content={info.fingerprints.sha256} />
                <Action.CopyToClipboard title="Copy SHA-1" content={info.fingerprints.sha1} />
              </>
            )}
          </ActionPanel>
        }
      />
    );
  }

  return (
    <Detail
      markdown={`## Paste Your Certificate Below\n\nUse the text area below or paste a PEM certificate into the search bar.\n\n\`\`\`\n-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----\n\`\`\``}
      actions={
        <ActionPanel>
          <Action
            title="Paste and Decode"
            icon={Icon.Clipboard}
            onAction={async () => {
              const t = await Clipboard.readText();
              if (t) {
                setInput(t.trim());
                setShowForm(false);
              }
            }}
            shortcut={{ modifiers: ["cmd"], key: "v" }}
          />
        </ActionPanel>
      }
    />
  );
}
