# Coauthored

**Tell the story of how humans and AI built this together.**

## What This Is

A self-describing format for documenting AI involvement in code. Fully static, no server required.

| This IS | This is NOT |
| --------- | ------------- |
| A voluntary, good-faith statement | A certification or audit |
| Self-reported by the author | Independently verified |
| Subjective assessment | Objective truth |
| Human-to-human communication | Legal documentation |

---

## Format

Statements are human-readable, self-describing strings:

```plaintext
v:1;o:co;scope:pr;intent:proto;oversight:func;risk.deploy:int;ai:doc,code;tools:Claude
```

**Structure:**

- `;` separates pairs
- `:` separates key from value
- `.` in keys = nesting (`risk.deploy` → `{ risk: { deploy: ... } }`)
- `,` in values = arrays (`ai:doc,code` → `['doc', 'code']`)
- `~` prefix = base64url encoded text (for special chars)

**Required fields:**

- `v` — format version (for decoding)
- `o` — origin (who defined this schema: `co` = coauthored.dev)

Everything else is up to the origin.

---

## URL

```plaintext
https://coauthored.dev/#v:1;o:co;scope:pr;intent:proto;oversight:func
```

Hash-based routing — works on any static host.

---

## Architecture

```plaintext
coauthored/
├── core.js      # Universal encoder/decoder (~150 lines, zero deps)
├── schema.js    # coauthored.dev's field definitions
├── assess.js    # coauthored.dev's assessment logic  
└── index.html   # Single-page app (wizard + viewer)
```

**core.js** is origin-agnostic. Works in browser, Node, Deno, Bun.

**schema.js** and **assess.js** are coauthored.dev's opinions. Forks replace these.

---

## Usage

### In a browser

```html
<script type="module">
  import { encode, decode } from 'https://coauthored.dev/core.js';
  
  const statement = encode({ scope: 'pr', intent: 'proto' });
  const data = decode(statement);
</script>
```

### In Node/Deno/Bun

```javascript
import { encode, decode, assess } from './core.js';

const data = {
  scope: 'pr',
  intent: 'proto',
  oversight: 'func',
  risk: { deploy: 'int', data: 'none' },
  ai: ['doc', 'code'],
  tools: 'Claude',
};

const encoded = encode(data);
// v:1;o:co;scope:pr;intent:proto;oversight:func;risk.deploy:int;risk.data:none;ai:doc,code;tools:Claude

const decoded = decode(encoded);
// { _v: 1, _o: 'co', scope: 'pr', ... }
```

### Badge (via shields.io)

```markdown
[![Coauthored](https://img.shields.io/badge/Coauthored-Well_Supervised-16a34a)](https://coauthored.dev/#v:1;o:co;scope:pr;...)
```

No server needed — shields.io renders the badge.

---

## coauthored.dev Schema

Fields we use (forks can define their own):

| Field | Type | Values |
| ------- | ------ | -------- |
| `scope` | enum | project, pr, file, component |
| `intent` | enum | explore, proto, validate, prod, learn |
| `trajectory` | enum | throw, iter, maint, unk |
| `oversight` | enum | line, func, spot, tests, min, none |
| `risk.deploy` | enum | local, int, cust, pub |
| `risk.data` | enum | none, int, pii, fin, health |
| `risk.safety` | enum | none, prop, well, life |
| `ai` | flags | doc, code, review, arch, test, sec |
| `valid` | flags | unit, integ, sec, expert, prod |
| `tools` | text | free text |
| `notes` | text | free text |
| `created` | date | YYYY-MM-DD |

---

## Forking

1. Copy `core.js` (unchanged — it's universal)
2. Create your own `schema.js` with your fields
3. Create your own `assess.js` with your logic
4. Set a unique origin: `encode(data, 'mycompany')`

Decoders will see `_o: 'mycompany'` and know it's your schema.

---

## Philosophy

- **Self-describing** — payload contains field names, not just values
- **Forward compatible** — unknown fields are preserved, not rejected
- **Decentralized** — anyone can fork, no registry needed
- **Human-readable** — you can parse it by eye
- **Static** — no server required

---

## Fine Print

Statements are self-reported, unverified, subjective, non-binding, without warranty.

This is a communication tool, not a certification.

---

*Built with AI. [View statement](https://coauthored.dev/#v:1;o:co;scope:project;intent:proto;trajectory:iter;ai:doc,code,arch;tools:Claude;oversight:func;risk.deploy:pub;risk.data:none;risk.safety:none)*

## Next Steps to Consider

- Test in browser
- Deploy to coauthored.dev (Cloudflare Pages or similar)
- npm publish for core.js
- GitHub Action for CI integration (advisory, not blocking)