import { Action, ActionPanel, Clipboard, Color, Detail, Icon, List } from "@raycast/api";
import { useEffect, useMemo, useState } from "react";

function luhnCheck(input: string): boolean {
  const digits = input.replace(/\s|-/g, "");
  if (!/^\d{2,}$/.test(digits)) return false;

  let sum = 0;
  let alternate = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

function computeCheckDigit(input: string): string | null {
  const digits = input.replace(/\s|-/g, "");
  if (!/^\d+$/.test(digits)) return null;

  let sum = 0;
  let alternate = true;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return String((10 - (sum % 10)) % 10);
}

function identifyCardNetwork(digits: string): string | null {
  const d = digits.replace(/\s|-/g, "");
  if (/^4\d{12}(\d{3})?$/.test(d)) return "Visa";
  if (/^5[1-5]\d{14}$/.test(d) || /^2[2-7]\d{14}$/.test(d)) return "Mastercard";
  if (/^3[47]\d{13}$/.test(d)) return "American Express";
  if (/^6(?:011|5\d{2})\d{12}$/.test(d)) return "Discover";
  if (/^3(?:0[0-5]|[68]\d)\d{11}$/.test(d)) return "Diners Club";
  if (/^35(?:2[89]|[3-8]\d)\d{12}$/.test(d)) return "JCB";
  if (/^62\d{14,17}$/.test(d)) return "UnionPay";
  return null;
}

function getNumberType(digits: string): string {
  const d = digits.replace(/\s|-/g, "");
  const len = d.length;
  if (len >= 13 && len <= 19) {
    const network = identifyCardNetwork(d);
    if (network) return `Credit/Debit Card (${network})`;
    return "Possible Card Number";
  }
  if (len === 10) return "Possible IMEI (partial) / ID";
  if (len === 15) return "Possible IMEI";
  return "Number";
}

export default function LuhnValidator() {
  const [input, setInput] = useState("");

  useEffect(() => {
    Clipboard.readText().then((t) => {
      if (t && /^[\d\s-]+$/.test(t.trim()) && t.trim().replace(/\s|-/g, "").length >= 2) {
        setInput(t.trim());
      }
    });
  }, []);

  const digits = input.replace(/\s|-/g, "");
  const hasValidChars = /^\d{2,}$/.test(digits);

  const result = useMemo(() => {
    if (!hasValidChars) return null;

    const valid = luhnCheck(digits);
    const checkDigit = computeCheckDigit(digits.slice(0, -1));
    const numberType = getNumberType(digits);
    const expectedCheck = computeCheckDigit(digits);

    return { valid, checkDigit, numberType, digits, expectedCheck };
  }, [digits, hasValidChars]);

  if (!input.trim()) {
    return (
      <List searchBarPlaceholder="Enter a number to validate (card, IMEI, etc.)..." onSearchTextChange={setInput} searchText={input}>
        <List.EmptyView title="Enter a Number" description="Type or paste a number to validate using the Luhn algorithm" icon={Icon.Shield} />
      </List>
    );
  }

  if (!hasValidChars) {
    return (
      <List searchBarPlaceholder="Enter a number to validate (card, IMEI, etc.)..." onSearchTextChange={setInput} searchText={input}>
        <List.EmptyView title="Invalid Input" description="Please enter only digits (spaces and dashes are allowed as separators)" icon={Icon.XMarkCircle} />
      </List>
    );
  }

  const valid = result!.valid;
  const checkDigit = result!.checkDigit;
  const numberType = result!.numberType;
  const fullNumber = result!.digits;

  const md = `
## Luhn Algorithm Validation

| Field | Value |
|-------|-------|
| **Input** | \`${fullNumber}\` |
| **Length** | ${fullNumber.length} digits |
| **Type** | ${numberType} |
| **Check Digit** | \`${checkDigit}\` |
| **Status** | ${valid ? "Valid" : "Invalid"} |

---

${
  valid
    ? `### Result: Valid\nThe number **passes** the Luhn check.`
    : `### Result: Invalid\nThe number **fails** the Luhn check. The correct check digit for \`${fullNumber.slice(0, -1)}\` would be \`${checkDigit}\`, making the valid number \`${fullNumber.slice(0, -1)}${checkDigit}\`.`
}

---

*The Luhn algorithm (mod-10) is used to validate credit card numbers, IMEI numbers, and other identification numbers.*
`;

  return (
    <Detail
      navigationTitle="Luhn Validator"
      markdown={md}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.TagList title="Status">
            <Detail.Metadata.TagList.Item
              text={valid ? "Valid" : "Invalid"}
              color={valid ? Color.Green : Color.Red}
            />
          </Detail.Metadata.TagList>
          <Detail.Metadata.Label title="Number" text={fullNumber} />
          <Detail.Metadata.Label title="Digits" text={String(fullNumber.length)} />
          <Detail.Metadata.Label title="Type" text={numberType} />
          <Detail.Metadata.Label title="Check Digit" text={checkDigit ?? "—"} />
          <Detail.Metadata.Separator />
          <Detail.Metadata.Label
            title="Algorithm"
            text="Luhn (Mod-10)"
          />
        </Detail.Metadata>
      }
      actions={
        <ActionPanel>
          <Action.CopyToClipboard title="Copy Number" content={fullNumber} />
          {!valid && checkDigit && (
            <Action.CopyToClipboard
              title="Copy Corrected Number"
              content={fullNumber.slice(0, -1) + checkDigit}
              shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
            />
          )}
          <Action.CopyToClipboard
            title="Copy Validation Result"
            content={`${fullNumber}: ${valid ? "Valid" : "Invalid"} (Luhn)`}
            shortcut={{ modifiers: ["cmd", "opt"], key: "c" }}
          />
        </ActionPanel>
      }
    />
  );
}
