# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Coauthored is a self-describing format for documenting AI involvement in code. Static-first, zero dependencies, works everywhere (browser, Node, Deno, Bun).

## Architecture

**Forkable Core Pattern:**
- `core.js` — Origin-agnostic encoder/decoder. Universal, never fork this.
- `schema.js` — Field definitions (what the wizard shows). Forks replace this.
- `assess.js` — Risk/oversight scoring logic. Forks replace this.
- `index.html` — Single-page app with inline CSS. Vanilla JS, no build step.

The separation exists so forks can define their own schemas while sharing the encoding format.

## Development

No build step, no package manager. Open `index.html` in a browser to test.

```bash
# Quick local server (any of these work)
python3 -m http.server 8000
npx serve .
```

## Code Conventions

- ES Modules throughout (`import`/`export`, not `require`)
- JSDoc comments on public functions
- No framework dependencies — vanilla JS only
- Inline CSS in `index.html` (intentional, keeps it single-file deployable)

## Format Encoding Rules

When working with the encoding format in `core.js`:
- `;` separates key:value pairs
- `.` in keys = object nesting (`risk.deploy` → `{ risk: { deploy } }`)
- `,` in values = arrays (`ai:doc,code` → `['doc', 'code']`)
- `~` prefix = base64url encoded (for special chars)
- `v` and `o` are required fields (version and origin)

## Assessment Scoring (assess.js)

Risk is calculated from `risk.*` fields (deploy, data, safety). Oversight from `oversight` field.
Assessment levels: critical → warning → moderate → good → info

Key thresholds:
- High risk (≥4) + low oversight (≤2) = critical
- High oversight (≥4) + tests = good

## Key Design Constraints

1. **No server required** — badges via shields.io, hash routing for static hosts
2. **Self-describing payloads** — field names in the string, not positional
3. **Forward compatible** — unknown fields preserved, not rejected
4. **Human-readable** — you can parse the format by eye
