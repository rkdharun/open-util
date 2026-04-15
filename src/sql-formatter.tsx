import { Action, ActionPanel, Clipboard, Form } from "@raycast/api";
import { format, FormatOptionsWithLanguage } from "sql-formatter";
import { useEffect, useMemo, useState } from "react";

type Dialect =
  | "sql"
  | "mysql"
  | "postgresql"
  | "sqlite"
  | "mariadb"
  | "bigquery"
  | "db2"
  | "hive"
  | "n1ql"
  | "plsql"
  | "redshift"
  | "spark"
  | "trino"
  | "tsql";

/** Guess the best dialect from SQL content */
function detectDialect(sql: string): Dialect {
  const s = sql.toUpperCase();
  // PostgreSQL: dollar-quoting, DO blocks, RETURNING, ::cast, CREATE OR REPLACE
  if (/\$\$|\$[A-Z_]+\$/.test(sql)) return "postgresql";
  if (/\bDO\s+\$/.test(sql)) return "postgresql";
  if (/\bRETURNING\b/.test(s) && /::/.test(sql)) return "postgresql";
  if (/\bSERIAL\b|\bBIGSERIAL\b|\bTEXT\b/.test(s) && /::\w/.test(sql)) return "postgresql";
  // T-SQL: TOP, NOLOCK, WITH(, GO, DECLARE @
  if (/\bTOP\s+\d|\bNOLOCK\b|\bWITH\s*\(NOLOCK\)|\bGO\b/.test(s)) return "tsql";
  if (/DECLARE\s+@/.test(s)) return "tsql";
  // MySQL: LIMIT x,y  or SHOW TABLES or ENGINE=
  if (/ENGINE\s*=\s*(INNODB|MYISAM)|AUTO_INCREMENT|`[^`]+`/.test(s)) return "mysql";
  // PL/SQL: BEGIN ... END; with EXCEPTION or PRAGMA
  if (/\bPRAGMA\b|\bEXCEPTION\b/.test(s) && /\bEND\s*;/.test(s)) return "plsql";
  // BigQuery: STRUCT<, ARRAY<, backtick project.dataset.table
  if (/\bSTRUCT\s*<|\bARRAY\s*</.test(s)) return "bigquery";
  return "sql";
}

export default function SqlFormatter() {
  const [input, setInput] = useState("");
  const [dialect, setDialect] = useState<Dialect>("sql");
  const [indent, setIndent] = useState("2");
  const [uppercase, setUppercase] = useState(true);
  const [autoDetected, setAutoDetected] = useState(false);

  useEffect(() => {
    Clipboard.readText().then((t) => {
      if (!t) return;
      setInput(t);
      const detected = detectDialect(t);
      setDialect(detected);
      setAutoDetected(detected !== "sql");
    });
  }, []);

  const output = useMemo(() => {
    if (!input.trim()) return "";
    try {
      const opts: FormatOptionsWithLanguage = {
        language: dialect,
        tabWidth: parseInt(indent, 10),
        keywordCase: uppercase ? "upper" : "preserve",
        linesBetweenQueries: 2,
      };
      return format(input, opts);
    } catch (e) {
      return `Error: ${e instanceof Error ? e.message : String(e)}`;
    }
  }, [input, dialect, indent, uppercase]);

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.CopyToClipboard title="Copy Output" content={output} shortcut={{ modifiers: ["cmd"], key: "return" }} />
          <Action title="Swap Input / Output" onAction={() => setInput(output)} shortcut={{ modifiers: ["cmd"], key: "s" }} />
          <Action title="Clear" onAction={() => setInput("")} shortcut={{ modifiers: ["cmd"], key: "k" }} />
        </ActionPanel>
      }
    >
      {autoDetected && (
        <Form.Description title="Auto-detected" text={`Dialect set to "${dialect}" based on your SQL content`} />
      )}
      <Form.Dropdown
        id="dialect"
        title="Dialect"
        value={dialect}
        onChange={(v) => { setDialect(v as Dialect); setAutoDetected(false); }}
      >
        <Form.Dropdown.Item value="sql" title="Standard SQL" />
        <Form.Dropdown.Item value="postgresql" title="PostgreSQL" />
        <Form.Dropdown.Item value="mysql" title="MySQL" />
        <Form.Dropdown.Item value="mariadb" title="MariaDB" />
        <Form.Dropdown.Item value="sqlite" title="SQLite" />
        <Form.Dropdown.Item value="tsql" title="T-SQL (SQL Server)" />
        <Form.Dropdown.Item value="plsql" title="PL/SQL (Oracle)" />
        <Form.Dropdown.Item value="bigquery" title="BigQuery" />
        <Form.Dropdown.Item value="redshift" title="Redshift" />
        <Form.Dropdown.Item value="db2" title="DB2" />
        <Form.Dropdown.Item value="hive" title="Hive" />
        <Form.Dropdown.Item value="spark" title="Spark" />
        <Form.Dropdown.Item value="trino" title="Trino" />
      </Form.Dropdown>
      <Form.Dropdown id="indent" title="Indent" value={indent} onChange={setIndent}>
        <Form.Dropdown.Item value="2" title="2 Spaces" />
        <Form.Dropdown.Item value="4" title="4 Spaces" />
      </Form.Dropdown>
      <Form.Checkbox
        id="uppercase"
        title="Keywords"
        label="UPPERCASE keywords"
        value={uppercase}
        onChange={setUppercase}
      />
      <Form.TextArea
        id="input"
        title="Input SQL"
        placeholder="Paste SQL here..."
        value={input}
        onChange={(v) => {
          setInput(v);
          const detected = detectDialect(v);
          setDialect(detected);
          setAutoDetected(detected !== "sql" && v.trim().length > 0);
        }}
      />
      <Form.TextArea id="output" title="Formatted SQL" value={output} onChange={() => undefined} />
    </Form>
  );
}
