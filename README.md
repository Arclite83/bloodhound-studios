# Bloodhound Studios — public site

Static legal and support pages for Bloodhound Studios titles. GitHub Pages
serves this repo from `main`, `/` (root); `.nojekyll` keeps Pages from running
the content through Jekyll.

```
/index.html                    studio landing
/gridinfect/index.html         Grid Infect — game and support page
/gridinfect/privacy.html       privacy policy
/gridinfect/terms.html         EULA
/gridinfect/suitability.html   age suitability
/gridinfect/notices.html       third-party licence notices
/404.html
```

The per-title subfolders are load-bearing: store consoles hold direct links
into them. Do not flatten them and do not rename a file once it has been
submitted to a console.

Every page is one self-contained HTML5 file with an inline `<style>` block.
There is no CSS file, no font, no script, no analytics and no tracker, and no
page makes an external network request. Keep it that way.

**This repo carries pages only.** No code, no build tooling, no game content.
It has to outlive the projects it documents.

Adding a title: copy the `gridinfect/` folder, replace the content, and add a
link from `/index.html`. Amending a policy: change the effective date in the
same commit.

Contact: bloodhoundstudios@gmail.com
