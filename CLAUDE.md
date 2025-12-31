# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

Coauthored is a config-driven, self-describing format for documenting AI involvement in code. Static-first, zero dependencies, works everywhere (browser, Node, Deno, Bun).

## Architecture

```
coauthored/
├── index.html        # HTML 1.0 style UI (fetches config at runtime)
├── core.js           # Universal encoder/decoder
├── config.js         # Config loader + validation + assess()
├── rules.js          # Safe boolean expression evaluator
├── coauthored.json   # Single source of truth config
├── cli.js            # CLI tool (same config as web UI)
└── package.json      # ES Module config
```

**Config-as-Contract Pattern:**
- `coauthored.json` — Defines everything: fields, categories, scoring rules, UI text
- `core.js` — Encoding format only, config-agnostic
- `config.js` — Loads config, validates, provides `assess()` function
- `rules.js` — Safe expression parser (no eval), used by config.js
- `index.html` — Minimal HTML 1.0 style UI, renders from config

Forks only need to edit `coauthored.json`. No code changes required.

## Development

```bash
# Local server
python3 -m http.server 8000

# Test CLI
node cli.js validate
node cli.js assess 'v:1;o:co;oversight:none;risk.deploy:pub'
```

## Code Conventions

- ES Modules throughout (`import`/`export`)
- JSDoc comments on public functions
- No framework dependencies — vanilla JS only
- HTML 1.0 style: native form controls, semantic HTML, minimal CSS

## Config Structure (coauthored.json)

```json
{
  "meta": { "formatVersion": 1, "schemaVersion": "1.0.0", "origin": "co" },
  "categories": { /* UI groupings with order */ },
  "fields": { /* field definitions with type, label, values, score */ },
  "scoring": { "computed": { /* derived values like risk, oversight */ } },
  "rules": [ /* boolean expression rules for assessment */ ],
  "ui": { /* title, tagline, notices, footer */ }
}
```

## Rules Engine (rules.js)

Rules use boolean expressions evaluated safely (no eval):

```json
{ "condition": "risk >= 4 AND oversight <= 2", "level": "critical" }
```

Supported operators:
- Comparisons: `>=`, `<=`, `>`, `<`, `==`, `!=`
- Logic: `AND`, `OR`, `NOT`
- Parentheses for grouping

The parser tokenizes → parses to AST → evaluates against context.

## Format Encoding (core.js)

- `;` separates key:value pairs
- `.` in keys = object nesting (`risk.deploy` → `{ risk: { deploy } }`)
- `,` in values = arrays (`ai:doc,code` → `['doc', 'code']`)
- `~` prefix = base64url encoded (for special chars)
- `v` and `o` are required fields (version and origin)

## Key Design Constraints

1. **Config-driven** — all business logic in JSON, not code
2. **No server required** — badges via shields.io, hash routing
3. **Self-describing payloads** — field names in the string
4. **Forward compatible** — unknown fields preserved
5. **Human-readable** — parse the format by eye
6. **CLI-compatible** — same config drives web UI and CLI
