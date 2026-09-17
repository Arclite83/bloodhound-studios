#!/usr/bin/env node
/*
 * Bloodhound Studios public site - pre-merge checks.
 *
 * Plain Node, no dependencies, no build step. Run it with `node tools/check.js`
 * from the repository root. It exits non-zero on the first category that fails
 * and prints every failure it found.
 *
 * These pages are entered into the Google Play Console, App Store Connect and
 * the AdMob console as live compliance URLs. A broken link or a stray
 * placeholder here is a store listing problem, not a cosmetic one.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

/* The site is served from a GitHub project Pages root. Absolute links inside
 * the pages carry this prefix; it maps back to the repository root on disk. */
const SITE_BASE = '/bloodhound-studios';

/* Paths already entered into store consoles. Renaming or moving any of these
 * turns a live listing link into a 404. They are frozen. */
const FROZEN = [
  'gridinfect/index.html',
  'gridinfect/privacy.html',
  'gridinfect/terms.html',
  'gridinfect/suitability.html',
  'gridinfect/notices.html',
];

const failures = [];
function fail(where, message) {
  failures.push(`${where}: ${message}`);
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const allFiles = walk(ROOT);
const pages = allFiles
  .filter((f) => f.endsWith('.html'))
  .map((f) => path.relative(ROOT, f))
  .sort();

const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

/* Strip HTML comments before scanning, so a commented-out draft cannot pass a
 * check that the rendered page would fail. Comments are still not allowed to
 * hide a placeholder: the placeholder scan runs on the raw source. */
const stripComments = (s) => s.replace(/<!--[\s\S]*?-->/g, '');

/* ---------------------------------------------------------------- 1. paths */

function checkFrozenPaths() {
  for (const rel of FROZEN) {
    if (!fs.existsSync(path.join(ROOT, rel))) {
      fail('frozen path', `${rel} is missing - a store console links directly to it`);
    }
  }
  for (const rel of ['index.html', '404.html', 'style.css', 'robots.txt', '.nojekyll']) {
    if (!fs.existsSync(path.join(ROOT, rel))) fail('required file', `${rel} is missing`);
  }
}

/* ------------------------------------------------------ 2. no placeholders */

const PLACEHOLDERS = [
  /\bTODO\b/,
  /\bFIXME\b/,
  /\bTBD\b/,
  /\bXXX\b/,
  /lorem ipsum/i,
  /\[JURISDICTION\]/i,
  /\[ADDRESS\]/i,
  /\bPLACEHOLDER\b/i,
  /\bCOMING SOON\b/i,
];

function checkPlaceholders() {
  for (const rel of pages) {
    const src = read(rel);
    for (const re of PLACEHOLDERS) {
      const m = src.match(re);
      if (m) fail(rel, `contains placeholder text "${m[0]}"`);
    }
  }
}

/* -------------------------------------------------- 3. no external requests */

/* A privacy policy that fetches a webfont from a third party contradicts
 * itself. Anchor links to an off-origin page are fine - the reader chooses to
 * follow them. A *subresource* the browser fetches on its own is not. */

function checkNoExternalRequests() {
  for (const rel of pages) {
    const src = stripComments(read(rel));

    if (/<script\b/i.test(src)) {
      fail(rel, 'contains a <script> tag; these pages must read with JavaScript off');
    }
    if (/@import/i.test(src)) {
      fail(rel, 'contains an @import');
    }
    for (const m of src.matchAll(/\bsrc\s*=\s*["']([^"']+)["']/gi)) {
      if (isOffOrigin(m[1])) fail(rel, `off-origin subresource src="${m[1]}"`);
    }
    for (const m of src.matchAll(/<link\b[^>]*>/gi)) {
      const tag = m[0];
      const href = (tag.match(/\bhref\s*=\s*["']([^"']+)["']/i) || [])[1];
      if (href && isOffOrigin(href)) fail(rel, `off-origin <link> href="${href}"`);
    }
    for (const m of src.matchAll(/url\(\s*["']?([^"')]+)/gi)) {
      if (isOffOrigin(m[1])) fail(rel, `off-origin CSS url(${m[1]})`);
    }
    for (const tag of ['iframe', 'embed', 'object', 'video', 'audio', 'source', 'track']) {
      if (new RegExp(`<${tag}\\b`, 'i').test(src)) {
        fail(rel, `contains a <${tag}> element; keep these pages to text and links`);
      }
    }
  }

  const css = fs
    .readFileSync(path.join(ROOT, 'style.css'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '');
  if (/@import/i.test(css)) fail('style.css', 'contains an @import');
  for (const m of css.matchAll(/url\(\s*["']?([^"')]+)/gi)) {
    if (isOffOrigin(m[1])) fail('style.css', `off-origin url(${m[1]})`);
  }
}

function isOffOrigin(url) {
  return /^(https?:)?\/\//i.test(url.trim()) || /^data:/i.test(url.trim());
}

/* ------------------------------------------------- 4. internal link targets */

function resolveInternal(rel, href) {
  if (href.startsWith('/')) {
    const withoutBase = href.startsWith(SITE_BASE + '/')
      ? href.slice(SITE_BASE.length + 1)
      : href === SITE_BASE || href === SITE_BASE + '/'
        ? ''
        : href.slice(1);
    return withoutBase;
  }
  return path.posix.normalize(path.posix.join(path.posix.dirname(rel), href));
}

/* A directory URL is served by its index.html. */
function targetExists(target) {
  if (target === '' || target.endsWith('/')) target = path.posix.join(target, 'index.html');
  const full = path.join(ROOT, target);
  if (!fs.existsSync(full)) return false;
  if (fs.statSync(full).isDirectory()) return fs.existsSync(path.join(full, 'index.html'));
  return true;
}

function idsIn(rel) {
  const src = read(rel);
  return new Set([...src.matchAll(/\bid\s*=\s*["']([^"']+)["']/gi)].map((m) => m[1]));
}

function checkInternalLinks() {
  for (const rel of pages) {
    const src = stripComments(read(rel));
    const hrefs = [...src.matchAll(/\bhref\s*=\s*["']([^"']+)["']/gi)].map((m) => m[1]);

    for (const href of hrefs) {
      const raw = href.trim();
      if (/^(https?:|mailto:|tel:)/i.test(raw)) continue;

      const [pathPart, fragment] = raw.split('#');

      if (pathPart === '') {
        /* Same-page fragment. */
        if (fragment && !idsIn(rel).has(fragment)) {
          fail(rel, `fragment #${fragment} has no matching id on this page`);
        }
        continue;
      }

      const target = resolveInternal(rel, pathPart);
      if (!targetExists(target)) {
        fail(rel, `link href="${raw}" resolves to ${target || '/'}, which does not exist`);
        continue;
      }
      if (fragment) {
        const resolved = target.endsWith('/') || target === ''
          ? path.posix.join(target, 'index.html')
          : target;
        if (resolved.endsWith('.html') && !idsIn(resolved).has(fragment)) {
          fail(rel, `link href="${raw}" points at #${fragment}, which does not exist in ${resolved}`);
        }
      }
    }
  }
}

/* ------------------------------------------------ 5. link graph completeness */

const SIBLINGS = [
  'gridinfect/index.html',
  'gridinfect/privacy.html',
  'gridinfect/terms.html',
  'gridinfect/suitability.html',
  'gridinfect/notices.html',
];

function checkLinkGraph() {
  for (const rel of SIBLINGS) {
    if (!fs.existsSync(path.join(ROOT, rel))) continue;
    const src = stripComments(read(rel));
    const linked = new Set(
      [...src.matchAll(/\bhref\s*=\s*["']([^"'#]+)(?:#[^"']*)?["']/gi)]
        .map((m) => m[1].trim())
        .filter((h) => !/^(https?:|mailto:|tel:)/i.test(h))
        .map((h) => resolveInternal(rel, h))
    );

    for (const sib of SIBLINGS) {
      if (sib === rel) continue;
      if (!linked.has(sib)) fail(rel, `does not link to its sibling ${sib}`);
    }
    if (!linked.has('index.html')) fail(rel, 'does not link back to the site root');
  }

  const rootSrc = stripComments(read('index.html'));
  for (const sib of SIBLINGS) {
    if (!rootSrc.includes(sib.replace('gridinfect/', 'gridinfect/'))) {
      fail('index.html', `site root does not list ${sib}`);
    }
  }
}

/* --------------------------------------------------------- 6. ground truth */

/* The counts are load-bearing: the store listing copy and the screenshots say
 * 16 worlds, 346 generated levels and 128 classic levels. World 13 is retired,
 * which is why it is 16 and not 17. Any other number on any page is drift. */

const COUNT_RULES = [
  { re: /(\d+)\s+(?:generated\s+)?worlds/gi, expected: '16', label: 'worlds' },
  { re: /(\d+)\s+generated\s+levels/gi, expected: '346', label: 'generated levels' },
  { re: /(\d+)\s+classic\s+levels/gi, expected: '128', label: 'classic levels' },
];

function checkCounts() {
  for (const rel of pages) {
    const src = stripComments(read(rel)).replace(/\s+/g, ' ');
    for (const rule of COUNT_RULES) {
      for (const m of src.matchAll(rule.re)) {
        if (m[1] !== rule.expected) {
          fail(rel, `says "${m[0].trim()}" - ${rule.label} must be ${rule.expected}`);
        }
      }
    }
  }

  /* The three counts have to actually appear somewhere, or a future edit could
   * delete them and still pass the rules above. */
  const surfaces = ['index.html', 'gridinfect/index.html'];
  for (const rel of surfaces) {
    const src = stripComments(read(rel)).replace(/\s+/g, ' ');
    if (!/16\s+generated\s+worlds/i.test(src)) fail(rel, 'does not state "16 generated worlds"');
    if (!/346\s+generated\s+levels/i.test(src)) fail(rel, 'does not state "346 generated levels"');
    if (!/128\s+classic\s+levels/i.test(src)) fail(rel, 'does not state "128 classic levels"');
  }
}

/* ------------------------------------------------------------ 7. metadata */

function checkMetadata() {
  for (const rel of pages) {
    const src = read(rel);
    if (!/<html[^>]*\blang\s*=\s*["'][^"']+["']/i.test(src)) fail(rel, 'no lang attribute on <html>');
    if (!/<title>\s*\S[\s\S]*?<\/title>/i.test(src)) fail(rel, 'no non-empty <title>');
    if (!/<meta\s+name=["']description["']\s+content=["'][^"']{20,}["']/i.test(src)) {
      fail(rel, 'no <meta name="description"> with real content');
    }
    if (!/<meta\s+name=["']viewport["']/i.test(src)) fail(rel, 'no <meta name="viewport">');
    if (!/<meta\s+name=["']robots["']/i.test(src)) {
      fail(rel, 'no <meta name="robots">; indexing must be stated, not left to omission');
    }
    if (!/<link\s+rel=["']stylesheet["']\s+href=["'](\.\.\/)?style\.css["']/i.test(src)) {
      fail(rel, 'does not use the shared same-origin stylesheet');
    }
    if (/<style\b/i.test(src)) fail(rel, 'has an inline <style> block; styling lives in style.css');
  }
}

/* -------------------------------------------- 8. cross-page consistency */

function checkConsistency() {
  const APP_PAGES = SIBLINGS;
  for (const rel of APP_PAGES) {
    const src = stripComments(read(rel)).replace(/\s+/g, ' ');
    if (!src.includes('Grid Infect')) fail(rel, 'does not name the app');
    if (/\bGridInfect\b|\bGrid-Infect\b/.test(src)) {
      fail(rel, 'writes the game name wrong; it is "Grid Infect", two words');
    }
    if (/\bBloodhound Studio\b(?!s)/.test(src)) {
      fail(rel, 'writes the studio name wrong; it is "Bloodhound Studios"');
    }
    if (!src.includes('bloodhoundstudios@gmail.com')) fail(rel, 'does not carry the support email');
  }

  /* Play requires the policy to name the app it covers. */
  const privacy = read('gridinfect/privacy.html');
  if (!privacy.includes('com.bloodhoundstudios.')) {
    fail('gridinfect/privacy.html', 'does not name the Android package id');
  }
  if (!/\bshares?\b/i.test(privacy)) {
    fail('gridinfect/privacy.html', 'does not say what is shared, only what is collected');
  }

  /* Privacy and suitability must not disagree about the child-directed
   * question. Both have to say the app is not directed at under-13s. */
  const notDirected = /not directed at children under 13/i;
  for (const rel of ['gridinfect/privacy.html', 'gridinfect/suitability.html']) {
    if (!notDirected.test(read(rel))) {
      fail(rel, 'does not state that the app is not directed at children under 13');
    }
  }

  /* Effective dates must agree across the app's legal pages. */
  const dates = new Map();
  for (const rel of APP_PAGES) {
    const m = read(rel).match(/(?:Effective|Generated)\s+(\d{1,2}\s+\w+\s+\d{4})/);
    if (m) dates.set(rel, m[1]);
  }
  const distinct = new Set(dates.values());
  if (distinct.size > 1) {
    fail('dates', `effective dates disagree: ${[...dates].map(([k, v]) => `${k}=${v}`).join(', ')}`);
  }
}

/* The trader address has to appear in the EULA (Apple's minimum terms require
 * the developer's name and address there), on the studio landing page, and in
 * the privacy policy as the controller's identity. It has to be the same
 * address in all three. */

const ADDRESS_LINES = ['565 Pleasant St', 'Southington, CT 06489', 'United States'];
const ADDRESS_PAGES = ['index.html', 'gridinfect/terms.html', 'gridinfect/privacy.html'];

function checkTraderAddress() {
  for (const rel of ADDRESS_PAGES) {
    const src = stripComments(read(rel)).replace(/\s+/g, ' ');
    for (const line of ADDRESS_LINES) {
      if (!src.includes(line)) fail(rel, `trader address is missing the line "${line}"`);
    }
  }
  /* A street number anywhere else on the site means a second address crept in. */
  for (const rel of pages) {
    if (ADDRESS_PAGES.includes(rel)) continue;
    const src = stripComments(read(rel)).replace(/\s+/g, ' ');
    if (/\bPleasant St\b|\bSouthington\b/.test(src)) {
      fail(rel, 'carries the trader address; it belongs only on the landing page, the EULA and the privacy policy');
    }
  }
  /* The EULA names a governing law. A jurisdiction-neutral fallback is fine to
   * ship but should not come back silently once one has been chosen. */
  const terms = stripComments(read('gridinfect/terms.html')).replace(/\s+/g, ' ');
  if (!/governed by the law of the State of Connecticut/.test(terms)) {
    fail('gridinfect/terms.html', 'clause 11 no longer names Connecticut as the governing law');
  }
}

/* ----------------------------------------- 9. licence text reproduction */

/* Apache-2.0 and OFL 1.1 both require the licence text to travel with the
 * distribution. Naming the licence does not discharge that. These are spot
 * checks on the opening and closing of each text, so a truncated paste fails. */

const LICENCE_MARKERS = {
  'Apache License 2.0': [
    'TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION',
    '2. Grant of Copyright License',
    '3. Grant of Patent License',
    '7. Disclaimer of Warranty',
    '8. Limitation of Liability',
    '9. Accepting Warranty or Additional Liability',
    'APPENDIX: How to apply the Apache License',
  ],
  'SIL Open Font License 1.1': [
    'PREAMBLE',
    'PERMISSION &amp; CONDITIONS',
    'Reserved Font Name',
    'TERMINATION',
    'DISCLAIMER',
  ],
  'MIT License': [
    'Permission is hereby granted, free of charge',
    'THE SOFTWARE IS PROVIDED &quot;AS IS&quot;',
  ],
};

function checkLicenceText() {
  const rel = 'gridinfect/notices.html';
  if (!fs.existsSync(path.join(ROOT, rel))) return;
  const src = read(rel).replace(/\s+/g, ' ');
  for (const [licence, markers] of Object.entries(LICENCE_MARKERS)) {
    for (const marker of markers) {
      if (!src.includes(marker.replace(/\s+/g, ' '))) {
        fail(rel, `${licence} text looks incomplete: missing "${marker}"`);
      }
    }
  }

  /* Every licence a component cites must have its text on the page. */
  for (const anchor of ['apache', 'ofl', 'mit']) {
    if (!new RegExp(`id=["']${anchor}["']`).test(read(rel))) {
      fail(rel, `no #${anchor} licence-text section to link component entries to`);
    }
  }
}

/* ------------------------------------------------------------------ run */

const checks = [
  ['frozen paths', checkFrozenPaths],
  ['placeholders', checkPlaceholders],
  ['external requests', checkNoExternalRequests],
  ['internal links', checkInternalLinks],
  ['link graph', checkLinkGraph],
  ['counts', checkCounts],
  ['metadata', checkMetadata],
  ['consistency', checkConsistency],
  ['trader address', checkTraderAddress],
  ['licence text', checkLicenceText],
];

for (const [name, fn] of checks) {
  const before = failures.length;
  fn();
  const added = failures.length - before;
  console.log(`${added === 0 ? 'ok  ' : 'FAIL'}  ${name}${added ? ` (${added})` : ''}`);
}

if (failures.length) {
  console.error(`\n${failures.length} problem${failures.length === 1 ? '' : 's'}:\n`);
  for (const f of failures) console.error(`  - ${f}`);
  console.error('');
  process.exit(1);
}

console.log(`\nAll checks passed across ${pages.length} pages.`);
