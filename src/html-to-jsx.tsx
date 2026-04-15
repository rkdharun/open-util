import { Action, ActionPanel, Clipboard, Form } from "@raycast/api";
import { useEffect, useMemo, useState } from "react";

// HTML attribute → JSX attribute map
const ATTR_MAP: Record<string, string> = {
  class: "className",
  for: "htmlFor",
  tabindex: "tabIndex",
  accesskey: "accessKey",
  contenteditable: "contentEditable",
  crossorigin: "crossOrigin",
  spellcheck: "spellCheck",
  autocomplete: "autoComplete",
  autofocus: "autoFocus",
  autoplay: "autoPlay",
  enctype: "encType",
  formaction: "formAction",
  formenctype: "formEncType",
  formmethod: "formMethod",
  formnovalidate: "formNoValidate",
  formtarget: "formTarget",
  frameborder: "frameBorder",
  novalidate: "noValidate",
  readonly: "readOnly",
  rowspan: "rowSpan",
  colspan: "colSpan",
  usemap: "useMap",
  "http-equiv": "httpEquiv",
  srcdoc: "srcDoc",
  srclang: "srcLang",
  srcset: "srcSet",
  charset: "charSet",
  cellpadding: "cellPadding",
  cellspacing: "cellSpacing",
  maxlength: "maxLength",
  minlength: "minLength",
};

// Void elements that need self-closing
const VOID_ELEMENTS = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "param", "source", "track", "wbr",
]);

function htmlToJsx(html: string): string {
  let result = html;

  // Convert attributes
  for (const [html_attr, jsx_attr] of Object.entries(ATTR_MAP)) {
    result = result.replace(
      new RegExp(`\\b${html_attr}(\\s*=\\s*["']?)`, "gi"),
      `${jsx_attr}$1`
    );
  }

  // Convert style="..." to style={{ ... }} (basic conversion)
  result = result.replace(/style="([^"]*)"/g, (_, styleStr) => {
    const styleObj = styleStr
      .split(";")
      .filter(Boolean)
      .map((prop: string) => {
        const [key, ...vals] = prop.split(":");
        const camelKey = key.trim().replace(/-([a-z])/g, (_: string, c: string) => c.toUpperCase());
        const val = vals.join(":").trim();
        const numericVal = !isNaN(Number(val)) && val !== "" ? val : `"${val}"`;
        return `${camelKey}: ${numericVal}`;
      })
      .join(", ");
    return `style={{ ${styleObj} }}`;
  });

  // Self-close void elements
  for (const tag of VOID_ELEMENTS) {
    result = result.replace(new RegExp(`<(${tag})(\\s[^>]*)?>`, "gi"), "<$1$2 />");
  }

  // Convert HTML comments to JSX comments
  result = result.replace(/<!--([\s\S]*?)-->/g, "{/* $1*/}");

  // Convert on* event handlers to camelCase
  result = result.replace(/\bon([a-z]+)=/gi, (_, evt) => `on${evt.charAt(0).toUpperCase()}${evt.slice(1)}=`);

  return result;
}

export default function HtmlToJsx() {
  const [input, setInput] = useState("");

  useEffect(() => {
    Clipboard.readText().then((t) => t && setInput(t));
  }, []);

  const output = useMemo(() => {
    if (!input.trim()) return "";
    try {
      return htmlToJsx(input);
    } catch (e) {
      return `Error: ${e instanceof Error ? e.message : String(e)}`;
    }
  }, [input]);

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.CopyToClipboard title="Copy Output" content={output} shortcut={{ modifiers: ["cmd"], key: "return" }} />
          <Action title="Clear" onAction={() => setInput("")} shortcut={{ modifiers: ["cmd"], key: "k" }} />
        </ActionPanel>
      }
    >
      <Form.TextArea id="input" title="Input HTML" placeholder="Paste HTML here..." value={input} onChange={setInput} />
      <Form.TextArea id="output" title="Output JSX" value={output} onChange={() => undefined} />
    </Form>
  );
}
