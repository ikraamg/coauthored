# CLAUDE.md

Guidance for AI coding assistants working on this codebase.

## Overview

Coauthored: config-driven format for documenting AI involvement in code. Static-first, zero dependencies.

## Architecture

```
coauthored/
├── index.html        # Entry point
├── styles.css        # CSS custom properties (--color-*, --space-*)
├── js/
│   ├── app.js        # Routing, orchestration
│   ├── form.js       # Wizard form rendering
│   ├── viewer.js     # Statement display
│   ├── stepper.js    # Multi-step navigation
│   ├── output.js     # Share/export UI
│   ├── theme.js      # Dark/light toggle
│   ├── toast.js      # Notifications
│   └── draft.js      # localStorage persistence
├── core.js           # Encoder/decoder (config-agnostic)
├── config.js         # Config loader + validation
├── coauthored.json   # Single source of truth
└── cli.js            # CLI tool
```

**Config-as-contract pattern:**

| File | Role |
| ---- | ---- |
| `coauthored.json` | Defines fields, categories, UI text |
| `core.js` | Encoding format only, config-agnostic |
| `config.js` | Loads config, validates structure |
| `js/*.js` | UI components, all config-driven |

Forks edit `coauthored.json`. No code changes required.

## Development

```bash
python3 -m http.server 8000    # Local server
node cli.js validate           # Validate config
node cli.js decode 'v:1;...'   # Test decoding
```

## Code Conventions

- ES Modules (`import`/`export`)
- JSDoc on public functions
- No framework dependencies
- No semicolons (standard JS style)
- CSS custom properties: `--color-*`, `--space-*`

## Encoding Format

| Rule | Example |
| ---- | ------- |
| `;` separates pairs | `scope:pr;ai:code` |
| `:` key/value delimiter | `scope:pr` |
| `.` nested keys | `tool.other` → `{ tool: { other } }` |
| `,` arrays | `ai:doc,code` → `['doc', 'code']` |
| `~` base64url prefix | `~SGVsbG8` → `"Hello"` |

Required: `v` (version), `o` (origin)

## Design Constraints

1. **Config-driven** — UI/field definitions in JSON, not code
2. **Self-describing** — payloads contain field names
3. **Forward compatible** — unknown fields preserved
4. **No server** — badges via shields.io, hash routing
5. **Human-readable** — parse format by eye
