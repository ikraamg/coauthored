[![AI Coauthored](https://img.shields.io/badge/AI_Coauthored-see_context-58a6ff?style=flat)](https://coauthored.dev/#v:1;o:~Y29hdXRob3JlZC5kZXY;created:2026-01-01;scope:project;intent:prod;traj:stable;ai:code,debug,refactor,doc,arch;tools:~Q2xhdWRlIENvZGU;review:spot,ran,iter;strengths:backend,domain;confident:code;env:external;data:low;valid:e2e;focus:arch,code,security,edge,perf;notes:~VGhlIGZvY3VzIGhlcmUgd2FzIHRvIGhhdmUgYSBwcm9kdWN0aW9uIHJlYWR5IGFwcHJvYWNoLiBBSSB3YXMgcmVsaWVkIG9uIHNpZ25pZmljYW50bHkgYnV0IHRob3JvdWdobHkgc3RlZXJlZC4gQWN0dWFsIGNvZGUgcXVhbGl0eSBhbmQgcGF0dGVybnMgbmVlZCB0byBiZSBhc3Nlc3NlZCBhbmQgaW1wcm92ZWQgYXMgdGhpcyB3YXMgbm90IGRlZXBseSBmb2N1c2VkIG9uLg)

# Coauthored

A transparency tool for documenting AI involvement in code. Config-driven, zero dependencies, runs in any browser or Node.js.

## Quick Start

```bash
# Local development
python3 -m http.server 8000
# Open http://localhost:8000

# CLI
node cli.js validate
node cli.js encode data.json
node cli.js decode 'v:1;o:co;scope:pr;ai:code'
```

## Format

Statements are self-describing strings:

```
v:1;o:co;scope:pr;intent:proto;ai:doc,code
```

**Encoding rules:**

| Symbol | Meaning | Example |
| ------ | ------- | ------- |
| `;` | Separates pairs | `scope:pr;ai:code` |
| `:` | Key/value delimiter | `scope:pr` |
| `.` | Nested keys | `risk.deploy` → `{ risk: { deploy } }` |
| `,` | Multiple values | `ai:doc,code` → `['doc', 'code']` |
| `~` | Base64url prefix | `~SGVsbG8` → `"Hello"` |

**Required fields:**

- `v` — Format version (currently `1`)
- `o` — Origin identifier (e.g., `co` for coauthored.dev)

Field definitions live in `coauthored.json`.

## Usage

### Browser

```html
<script type="module">
  import { loadConfig } from './config.js'
  import { encode, decode } from './core.js'

  const config = await loadConfig()
  const encoded = encode({ scope: 'pr', intent: 'proto' }, config)
  const data = decode(encoded)
</script>
```

### CLI

```bash
node cli.js validate              # Validate config
node cli.js encode data.json      # JSON → statement
node cli.js decode 'v:1;o:...'    # Statement → JSON
node cli.js badge 'v:1;o:...'     # Generate badge URL
node cli.js markdown 'v:1;o:...'  # Generate markdown badge
```

### Badge

```markdown
[![Coauthored](https://img.shields.io/badge/Coauthored-see_context-58a6ff)](https://coauthored.dev/#v:1;o:co;scope:pr;...)
```

## Project Structure

```
coauthored/
├── index.html        # Entry point
├── styles.css        # Theming via CSS custom properties
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
├── coauthored.json   # Field definitions, UI text
├── cli.js            # CLI tool
└── package.json
```

## Configuration

`coauthored.json` defines everything:

```json
{
  "meta": {
    "formatVersion": 1,
    "schemaVersion": "2.0.0",
    "origin": "coauthored.dev"
  },
  "categories": { /* UI groupings */ },
  "fields": { /* field definitions */ },
  "ui": { /* labels, notices, badge config */ }
}
```

Edit this file to customize fields, categories, or UI text. No code changes required.

## Forking

1. Copy all files
2. Edit `coauthored.json`:
   - Change `meta.origin` to your identifier
   - Modify fields, categories, scoring as needed
3. Deploy

Statements will include `o:yourorigin`, identifying your schema.

## Deploy

```bash
git push origin main
# Enable GitHub Pages → select main branch
```

No build step.

## Note

Statements are self-reported by authors.
