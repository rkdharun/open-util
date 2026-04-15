# open-util

> 38 developer utilities inside Raycast — encoding, formatting, generating, parsing, and more. Works **entirely offline**.

![Extension Icon](assets/extension-icon.png)

---

## Tools

### Encoding & Decoding
| Command | Description |
|---|---|
| **Base64 Encoder / Decoder** | Encode and decode Base64 strings (UTF-8, ASCII, Latin-1) |
| **URL Encoder / Decoder** | `encodeURI`, `decodeURI`, `encodeURIComponent`, `decodeURIComponent` |
| **HTML Entity Encoder / Decoder** | Encode/decode HTML entities using named references |
| **Backslash Escaper / Unescaper** | Escape or unescape `\n`, `\t`, `\\`, `\"` and more |
| **Hex ↔ ASCII Converter** | Convert between hexadecimal and ASCII strings |

### Formatters & Converters
| Command | Description |
|---|---|
| **JSON Formatter / Validator** | Format, minify, or validate JSON with error highlighting |
| **YAML ↔ JSON Converter** | Convert between YAML and JSON — auto-detects format from clipboard |
| **JSON ↔ CSV Converter** | Convert JSON arrays to CSV and back |
| **XML Beautifier / Minifier** | Format or minify XML |
| **HTML Beautifier / Minifier** | Format or minify HTML |
| **CSS Beautifier / Minifier** | Format or minify CSS |
| **JavaScript Beautifier / Minifier** | Format or minify JavaScript |
| **SQL Formatter** | Format SQL with auto-dialect detection (PostgreSQL, MySQL, T-SQL, and more) |
| **HTML to JSX Converter** | Convert HTML to JSX — `class→className`, `for→htmlFor`, self-close void elements |
| **SVG to CSS Converter** | Convert SVG to CSS `background-image` with Base64 or URL encoding |
| **PHP Serializer / Unserializer** | Serialize and unserialize PHP data format |
| **Query String ↔ JSON** | Convert URL query parameters to JSON and back |

### Generators
| Command | Description |
|---|---|
| **UUID / ULID Generator** | Generate UUID v1, UUID v4, ULID, Nano ID — regenerate with ⌘R |
| **Hash Generator** | MD5, SHA-1, SHA-224, SHA-256, SHA-384, SHA-512, SHA3-256, SHA3-512 |
| **Random String Generator** | Customizable charset (lowercase, uppercase, digits, special, hex, Base64URL) |
| **Lorem Ipsum Generator** | Generate words, sentences, or paragraphs |
| **QR Code Generator** | Generate QR codes with selectable error correction level |

### Analyzers & Testers
| Command | Description |
|---|---|
| **RegExp Tester** | Live regex matching with match count, groups, and named captures |
| **String Inspector** | Character count, byte size, word count, line count, top characters |
| **String Case Converter** | camelCase, PascalCase, snake_case, CONSTANT_CASE, kebab-case, and more |
| **Text Diff Checker** | Line, word, or character diff between two texts |
| **Line Sort / Dedupe** | Sort A→Z, Z→A, by length, reverse, shuffle — with trim and dedupe options |

### Parsers
| Command | Description |
|---|---|
| **URL Parser** | Break a URL into protocol, host, path, query params, and fragment |
| **Unix Time Converter** | Convert timestamps ↔ human-readable dates across all timezones |
| **Cron Job Parser** | Explain cron expressions in plain English + show next 5 run times |
| **JWT Debugger** | Decode JWT header and payload, show expiry status and standard claims |
| **JSON Path Selector** | Extract data from JSON using JSONPath expressions |

### Colors & Numbers
| Command | Description |
|---|---|
| **Color Converter** | HEX, RGB, RGBA, HSL, HSLA, HSV, CMYK, Swift, Android, .NET, Objective-C |
| **Number Base Converter** | Convert between binary, octal, decimal, hex, base32, base36 |

### Previews
| Command | Description |
|---|---|
| **Markdown Preview** | Render Markdown — copy as HTML with ⌘H |
| **HTML Preview** | Open rendered HTML in your default browser |

### Utilities
| Command | Description |
|---|---|
| **cURL to Code** | Convert cURL commands to Python, JavaScript, Node.js, Go, PHP, Ruby |
| **X.509 Certificate Decoder** | Decode PEM certificates — subject, issuer, SANs, fingerprints, validity |

---

## Installation

### Requirements
- [Raycast](https://raycast.com) — macOS only
- Node.js 18 or later
- npm 9 or later

---

### Option 1 — Install from source (recommended)

**1. Clone the repository**
```bash
git clone https://github.com/rkdharun/open-util.git
cd open-util
```

**2. Install dependencies**
```bash
npm install
```

**3. Import into Raycast**
```bash
npm run dev
```

This opens Raycast and prompts you to import the extension. Click **Import Extension** when the dialog appears. The extension will hot-reload as you make changes.

---

### Option 2 — One-liner setup

```bash
git clone https://github.com/rkdharun/open-util.git && cd open-util && npm install && npm run dev
```

---

### Verify it works

1. Open Raycast (`⌘ Space`)
2. Type any tool name — e.g. **"JSON Formatter"**, **"JWT Debugger"**, or **"Hash Generator"**
3. Press `↩` to open it

---

## Usage Tips

| Shortcut | Action |
|---|---|
| `⌘ ↩` | Copy output to clipboard |
| `⌘ S` | Swap input ↔ output (for reversible tools) |
| `⌘ R` | Regenerate (UUID, Random String, Lorem Ipsum) |
| `⌘ K` | Clear input |

**Clipboard auto-fill** — Most tools automatically detect and populate relevant content from your clipboard when opened. For example:
- Opening **JWT Debugger** with a JWT token in your clipboard decodes it instantly
- Opening **JSON Formatter** with valid JSON pre-fills the input
- Opening **Color Converter** with `#hex` or `rgb(...)` converts immediately

---

## Development

```bash
# Start with hot reload
npm run dev

# Type check
npx tsc --noEmit

# Lint
npm run lint
npm run fix-lint

# Build for production
npm run build
```

### Project structure

```
src/
├── utils.ts                  # Shared clipboard helper
├── json-formatter.tsx
├── base64.tsx
├── url-encoder.tsx
├── ...                       # One file per command
```

Each command is a self-contained React component. The pattern is:
1. Auto-read clipboard on mount
2. Transform input with `useMemo`
3. Show output inline — copy with `⌘↩`

---

## Tech Stack

| Package | Used for |
|---|---|
| `@raycast/api` | Raycast UI components and APIs |
| `js-yaml` | YAML ↔ JSON |
| `papaparse` | CSV parsing |
| `js-beautify` | HTML / CSS / JS formatting |
| `sql-formatter` | SQL formatting (13 dialects) |
| `fast-xml-parser` | XML parsing and building |
| `diff` | Text diff |
| `change-case` | String case conversion |
| `colord` | Color conversion |
| `cronstrue` | Cron expression parsing |
| `marked` | Markdown → HTML |
| `uuid` + `ulid` + `nanoid` | ID generation |
| `node-forge` | X.509 certificate decoding |
| `he` | HTML entity encoding |
| `qrcode` | QR code generation |
| `jsonpath-plus` | JSONPath queries |
| `lorem-ipsum` | Lorem ipsum generation |
| `crypto` (built-in) | Hashing, random bytes |

---

## License

MIT
