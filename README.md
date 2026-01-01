[![AI Coauthored](https://img.shields.io/badge/AI_Coauthored-↗_see_details-58a6ff?style=flat)](https://coauthored.dev/#v:1;o:~Y29hdXRob3JlZC5kZXY;created:2026-01-01;scope:project;intent:prod;traj:stable;ai:code,debug,refactor,doc,arch;tools:~Q2xhdWRlIENvZGU;review:spot,ran,iter;strengths:backend,domain;confident:code;env:external;data:low;valid:e2e;focus:arch,code,security,edge,perf;notes:~VGhlIGZvY3VzIGhlcmUgd2FzIHRvIGhhdmUgYSBwcm9kdWN0aW9uIHJlYWR5IGFwcHJvYWNoLiBBSSB3YXMgcmVsaWVkIG9uIHNpZ25pZmljYW50bHkgYnV0IHRob3JvdWdobHkgc3RlZXJlZC4gQWN0dWFsIGNvZGUgcXVhbGl0eSBhbmQgcGF0dGVybnMgbmVlZCB0byBiZSBhc3Nlc3NlZCBhbmQgaW1wcm92ZWQgYXMgdGhpcyB3YXMgbm90IGRlZXBseSBmb2N1c2VkIG9uLg)

# Coauthored

**Tell the story of how humans and AI built this together.**

## What This Is

A self-describing, config-driven format for documenting AI involvement in code. Fully static, zero dependencies.

| This IS | This is NOT |
| --------- | ------------- |
| A voluntary, good-faith statement | A certification or audit |
| Self-reported by the author | Independently verified |
| Subjective assessment | Objective truth |
| Human-to-human communication | Legal documentation |

---

## Quick Start

```bash
# Run locally
python3 -m http.server 8000
# Open http://localhost:8000

# Or use CLI
node cli.js validate
node cli.js encode data.json
node cli.js assess 'v:1;o:co;scope:pr;oversight:func'
```

---

## Format

Statements are human-readable, self-describing strings:

```
v:1;o:co;scope:pr;intent:proto;oversight:func;risk.deploy:int;ai:doc,code
```

**Structure:**

- `;` separates pairs
- `:` separates key from value
- `.` in keys = nesting (`risk.deploy` → `{ risk: { deploy: ... } }`)
- `,` in values = arrays (`ai:doc,code` → `['doc', 'code']`)
- `~` prefix = base64url encoded text (for special chars)

**Required fields:**

- `v` — format version
- `o` — origin (who defined this schema: `co` = coauthored.dev)

---

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
├── cli.js            # CLI tool
└── package.json      # ES Module config
```

**Config-driven design:** Everything is defined in `coauthored.json` — fields, categories, UI text. Change the config, change the behavior.

---

## Config Structure

```json
{
  "meta": {
    "formatVersion": 1,
    "schemaVersion": "2.0.0",
    "origin": "co"
  },
  "categories": { /* UI groupings with order */ },
  "fields": { /* field definitions with type, label, values */ },
  "ui": { /* title, tagline, badge, notices, footer */ }
}
```

---

## Usage

### Browser

```html
<script type="module">
  import { loadConfig, assess } from './config.js';
  import { encode, decode } from './core.js';

  const config = await loadConfig();
  const encoded = encode({ scope: 'pr', intent: 'proto' }, config);
  const data = decode(encoded);
  const result = assess(data, config);
</script>
```

### CLI

```bash
# Validate config
node cli.js validate

# Encode JSON to statement
echo '{"scope":"pr","intent":"prod"}' > data.json
node cli.js encode data.json

# Decode statement
node cli.js decode 'v:1;o:co;scope:pr;intent:prod'

# Assess risk/oversight
node cli.js assess 'v:1;o:co;oversight:none;risk.deploy:pub'

# Generate badge
node cli.js badge 'v:1;o:co;oversight:func'
node cli.js markdown 'v:1;o:co;oversight:func'
```

### Badge (via shields.io)

```markdown
[![Coauthored](https://img.shields.io/badge/Coauthored-Well_Supervised-16a34a)](https://coauthored.dev/#v:1;o:co;scope:pr;...)
```

---

## Fields

Default fields (defined in `coauthored.json`):

| Field | Type | Description |
| ------- | ------ | ----------- |
| `scope` | enum | project, pr, file, component |
| `intent` | enum | explore, proto, validate, prod, learn |
| `trajectory` | enum | throw, iter, maint, unk |
| `oversight` | enum | line, func, spot, tests, min, none |
| `risk.deploy` | enum | local, int, cust, pub |
| `risk.data` | enum | none, int, pii, fin, health |
| `risk.safety` | enum | none, prop, well, life |
| `ai` | flags | doc, code, review, arch, test, sec |
| `valid` | flags | unit, integ, sec, expert, prod |
| `tools` | text | AI tools used |
| `notes` | text | Additional context |
| `created` | date | Auto-filled |

---

## Forking

1. Copy all files to your repo
2. Edit `coauthored.json`:
   - Change `meta.origin` to your identifier
   - Add/remove/modify fields
   - Adjust scoring rules
3. Deploy to GitHub Pages
4. Done — no code changes needed

Your statements will have `o:yourorigin` and decoders will know it's your schema.

---

## Deploy to GitHub Pages

```bash
git add .
git commit -m "Deploy coauthored"
git push origin main
# Enable GitHub Pages in repo settings → select main branch
```

That's it. No build step.

---

## Philosophy

- **Config-driven** — all behavior defined in JSON, not code
- **Self-describing** — payload contains field names, not just values
- **Forward compatible** — unknown fields are preserved
- **Decentralized** — anyone can fork, no registry
- **Human-readable** — parse it by eye
- **Static** — no server required

---

## Fine Print

Statements are self-reported, unverified, subjective, non-binding, without warranty.

This is a communication tool, not a certification.

---

*Built with AI. [View statement](https://coauthored.dev/#v:1;o:co;scope:project;intent:prod;ai:doc,code,arch;tools:Claude;oversight:func)*
