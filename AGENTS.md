# AGENTS.md

## Cursor Cloud specific instructions

This is a zero-dependency, static-first web app with a CLI tool. No build step, no `npm install`, no bundler.

### Running the dev server

```bash
python3 -m http.server 8000
# Then open http://localhost:8000
```

ES Modules and `fetch()` require HTTP — `file://` will not work.

### CLI commands

See `README.md` for full list. Key commands:

- `node cli.js validate` — validate `coauthored.json` config
- `node cli.js decode 'v:1;o:...'` — decode a statement to JSON
- `node cli.js encode data.json` — encode JSON to statement
- `node cli.js badge 'v:1;o:...'` — generate shields.io badge URL

### Key notes

- `coauthored.json` is the single source of truth for fields, categories, and UI text. All UI is config-driven.
- No linter or test framework is configured. Validation is done via `node cli.js validate`.
- The web app uses hash-based routing: a URL hash containing a statement (e.g. `#v:2;o:...`) triggers viewer mode; no hash shows the creator form.
