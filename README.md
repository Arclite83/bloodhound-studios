# Bloodhound Studios — public site

Static legal and support pages for Bloodhound Studios titles. GitHub Pages
serves this repo from `main`, `/` (root); `.nojekyll` keeps Pages from running
the content through Jekyll.

```
/index.html                    studio landing
/style.css                     the only stylesheet, shared by every page
/robots.txt                    indexing decision, with its caveat
/404.html
/gridinfect/index.html         Grid Infect — game and support page
/gridinfect/privacy.html       privacy policy
/gridinfect/terms.html         EULA
/gridinfect/suitability.html   age suitability
/gridinfect/notices.html       third-party licence notices
/tools/check.js                pre-merge checks, plain Node, no dependencies
/OPEN-QUESTIONS.md             decisions still waiting on a value
```

The per-title subfolders are load-bearing: store consoles hold direct links
into them. Do not flatten them and do not rename a file once it has been
submitted to a console. `tools/check.js` fails if one of the five Grid Infect
paths moves.

## Rules these pages hold to

Hand-written HTML plus one shared stylesheet. No build step, no framework, no
dependency to install. Whoever fixes a clause in two years should be able to
open the file and edit it.

No script, no webfont, no image, no analytics, no tracker. Every page reads with
JavaScript off and makes exactly two requests: itself and `style.css`, both
same-origin. A privacy policy that loads a font from a third party contradicts
itself. Anchor links out to Google's own policies are fine — the reader chooses
to follow those.

Every page is readable at 390px wide. Store reviewers open these on a phone.

## Checks

```
node tools/check.js
```

Runs in CI on every push and every pull request into `main`
(`.github/workflows/check.yml`, status check name `check`). It asserts the five
frozen paths exist, that no page carries a placeholder, that nothing off-origin
is fetched, that every internal link and fragment resolves, that each page links
its siblings and the root, that the level and world counts match the shipped
game, that page metadata is present, that the legal pages agree with each other,
and that `notices.html` still reproduces the Apache 2.0, MIT and OFL 1.1 texts in
full rather than naming them.

Making a red run block the merge needs a branch ruleset, which is a repository
setting rather than a file. See `OPEN-QUESTIONS.md`.

## Editing

**This repo carries pages only.** No code, no build tooling, no game content.
It has to outlive the projects it documents.

Adding a title: copy the `gridinfect/` folder, replace the content, add a link
from `/index.html`, and extend the `FROZEN` and `SIBLINGS` lists in
`tools/check.js`.

Amending a policy: change the effective date in the same commit. The check
requires the effective dates on the Grid Infect legal pages to agree, so they
move together.

Contact: bloodhoundstudios@gmail.com
