# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

Coauthored is a config-driven, self-describing format for documenting AI involvement in code. Static-first, zero dependencies, works everywhere (browser, Node, Deno, Bun).

## Architecture

```
coauthored/
├── index.html        # Entry point (loads modules)
├── styles.css        # CSS with custom properties & theming
├── js/
│   ├── app.js        # Main orchestration & routing
│   ├── form.js       # Wizard form rendering & data collection
│   ├── viewer.js     # Statement viewer
│   ├── stepper.js    # Multi-step wizard navigation
│   ├── theme.js      # Dark/light theme toggle
│   ├── toast.js      # Toast notifications
│   └── draft.js      # localStorage draft persistence
├── core.js           # Universal encoder/decoder
├── config.js         # Config loader + validation
├── coauthored.json   # Single source of truth config
├── cli.js            # CLI tool (same config as web UI)
└── package.json      # ES Module config
```

**Config-as-Contract Pattern:**
- `coauthored.json` — Defines everything: fields, categories, UI text
- `core.js` — Encoding format only, config-agnostic
- `config.js` — Loads config, validates structure
- `js/*.js` — Modular UI components, all config-driven

Forks only need to edit `coauthored.json`. No code changes required.

## Development

```bash
# Local server
python3 -m http.server 8000

# Test CLI
node cli.js validate
node cli.js decode 'v:1;o:co;scope:pr;ai:code'
```

## Code Conventions

- ES Modules throughout (`import`/`export`)
- JSDoc comments on public functions
- No framework dependencies — vanilla JS only
- CSS custom properties for theming (`--color-*`, `--space-*`)
- No semicolons (standard JS style)

## UI Features

- **Theme toggle**: Dark/light mode with system preference detection
- **Draft persistence**: Form data saved to localStorage
- **Multi-step wizard**: Keyboard navigation (←→, 1-6, ⌘+Enter)
- **Toast notifications**: Copy feedback with auto-dismiss

## Config Structure (coauthored.json)

```json
{
  "meta": { "formatVersion": 1, "schemaVersion": "2.0.0", "origin": "co" },
  "categories": { /* UI groupings with order */ },
  "fields": { /* field definitions with type, label, values */ },
  "ui": { /* title, tagline, badge, notices, footer */ }
}
```

## Format Encoding (core.js)

- `;` separates key:value pairs
- `.` in keys = object nesting (`tool.other` → `{ tool: { other } }`)
- `,` in values = arrays (`ai:doc,code` → `['doc', 'code']`)
- `~` prefix = base64url encoded (for special chars)
- `v` and `o` are required fields (version and origin)

## Key Design Constraints

1. **Config-driven** — all UI/field definitions in JSON, not code
2. **No server required** — badges via shields.io, hash routing
3. **Self-describing payloads** — field names in the string
4. **Forward compatible** — unknown fields preserved
5. **Human-readable** — parse the format by eye
6. **CLI-compatible** — same config drives web UI and CLI
