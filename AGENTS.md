# AGENTS.md

House rules for AI agents (Cursor cloud agents, Claude Code) working in this repo.
`CLAUDE.md` imports this file; keep the rules here only.

## What this repo is

- The **built static output** of the Plenary marketing site (canonical URL `https://plenary.life/`).
- **Source lives in `counciloftroas/plenary-site` (private).** A bot there builds the site and pushes
  commits titled `Deploy <source-sha>` to `main` here.
- Deploys use GitHub Pages: the legacy build runs from `main`, path `/`. Every push to `main` goes live.
- `.nojekyll` is present, so Pages does **not** run Jekyll: every file is served as-is (including
  this file and `CLAUDE.md`, so never put secrets or internal-only notes in them). Do not delete `.nojekyll`.

## Where edits belong

Make content, style, and script changes in **`plenary-site`** whenever possible, because this repo is
generated output. Hand edits here can be overwritten by the next deploy. The history so far is
one deploy commit, which suggests deploys may replace `main` wholesale. If a file you added here
disappears, that is the cause; port the change to the source repo.

If an edit truly must be made here (a hotfix, for example), these are the files that matter:

| Path | Purpose |
| --- | --- |
| `index.html` | Home page |
| `404.html` | Custom 404 page (Pages serves it) |
| `privacy/`, `terms/`, `cookies/`, `mini-report/` | Sub-pages (`index.html` each) |
| `css/site.css` | Site stylesheet |
| `js/*.js` | Site scripts (nav, consent, lead form, hero demo, legal) |
| `vendor/` | Bundled React and design-system JS. Never hand-edit |
| `assets/` | Images, video, favicons, OG image |
| `robots.txt`, `sitemap.xml` | SEO |
| `_headers`, `_redirects` | Netlify/Cloudflare-style host config. GitHub Pages ignores them |

Assets are referenced with relative paths (`./css/...`, `./assets/...`) because the Pages URL can be a
sub-path (`/plenary-site-live/`). Keep new references relative; do not switch to root-absolute `/...`.
Mirror any hotfix into `plenary-site` so the next deploy doesn't revert it.

## Git

- Trunk-based: make small, focused commits straight to `main`. No long-lived branches.
- Write clear, imperative commit messages that say what changed.
- **No AI co-author trailers** (`Co-authored-by: ...` for Claude, Cursor, Copilot, etc.) and no
  "generated with" footers in commits or PR descriptions.

## Working style

- Make the smallest change that does the job; don't touch unrelated files or reformat minified/built output.
- Don't add build tooling, package files, or CI here; that belongs in `plenary-site`.
- Skip exploration you don't need. The repo is roughly 50 static files; read only what the task touches.
- After any change, check links and assets: every `href`/`src` you touched resolves to a file that
  exists in the repo (or a valid external URL). A quick local check is
  `python3 -m http.server` at the repo root, then load the affected pages.
