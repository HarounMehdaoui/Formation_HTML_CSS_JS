# Web Basics Workshop

An interactive beginner workshop that teaches HTML, CSS and JavaScript in 7 steps.
Each step has a short lesson, then a hands-on lab: edit the starter code, watch the
live preview, and the page automatically checks whether you reached the goal.

Two reading pages frame the labs:

- **Start here: Website anatomy** (`#intro`): the parts of a showcase website
  (header, hero, sections, footer), their HTML tags, and which step teaches each part.
  Shown on the first visit.
- **Going further** (`#beyond`, unlocked after Step 7): Tailwind CSS, Bootstrap and
  React, each redoing something from the labs, with live demos that load from CDNs
  only when the learner clicks "Run the live demo".

It's a plain static site with no framework, build step or backend:

| File         | What it does                                                        |
| ------------ | ------------------------------------------------------------------- |
| `index.html` | Page structure                                                      |
| `style.css`  | All styles                                                          |
| `app.js`     | Navigation, editor, live preview, checks and saved progress         |
| `labs.js`    | All content: lessons, starter code, hints, solutions and checks     |

The code editor (CodeMirror 5) and the fonts load from public CDNs, so you need an
internet connection. If the editor can't load, the site falls back to a plain text box.

## Run it locally

Option 1: open `index.html` in your browser (double-click it).

Option 2: use a small local server, which behaves exactly like the hosted site:

```bash
# from this folder
python3 -m http.server 8000
# then open http://localhost:8000
```

(`npx serve .` works too if you have Node.js.)

Progress and code are saved in the browser's `localStorage`. Use **Reset all progress**
at the bottom of the page to start over.

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. On [vercel.com](https://vercel.com), click **Add New… → Project** and import the repository.
3. Keep the defaults (Framework Preset: *Other*, no build command, no output directory) and click **Deploy**.

No configuration is needed: Vercel serves `index.html` as a static site.

## Editing the content

Everything a learner reads or is tested on lives in `labs.js`. The two reading pages
are `intro` and `beyond` at the bottom of the file; they use the same lesson blocks plus
`{ h2 }`, `{ table }`, `{ compare }` (code side by side) and `{ demo }` (a live result).
Each step has:

- `lesson`: blocks of text (`{ p }`, `{ ul }`, `{ ol }`, `{ h }`, `{ code, lang }`, `{ html }`).
  Inside text, `` `code` `` is shown in monospace, plus `**bold**` and `*italic*`.
- `lab.tabs`: which editor tabs to show (`html`, `css`, `js`).
- `lab.starter` / `lab.solution`: the code for each tab.
- `lab.hints`: revealed one at a time.
- `lab.criteria`: `{ label, check(doc, win) }`. `check` receives the preview's `document`
  and `window` and must return `true` when the goal is met. Check real results
  (`getComputedStyle`, `classList`, `textContent`, `element.click()`), not the source code.
- `lab.freshPageForEachCheck`: set to `true` when checks click things, so each check
  starts from a freshly loaded page.

Checks run in a hidden copy of the preview, so simulated clicks never change what the
learner sees.
