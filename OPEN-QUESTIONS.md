# Open questions — Grid Infect legal and support pages

One item left, and it is a repository setting rather than a file. Everything
else in the audit is resolved and on the page. No placeholder text exists on any
live page, and `tools/check.js` fails the build if one appears.

---

## 1. Make a failing check actually block the merge

**Where:** repository settings — not a file, so I could not do it.

`.github/workflows/check.yml` runs `tools/check.js` on every push and on every
pull request into `main`, and reports a status check named **`check`**. Reporting
is not blocking. To block:

> Settings → Rules → Rulesets → New branch ruleset → target `main` →
> enable **Require status checks to pass** → add **`check`** →
> enable **Require a pull request before merging**.

Do this after this PR's first run, so the check name is available in the picker.

**Decision needed:** none, unless you would rather not require a PR to push to
`main` on a repo you are the only committer on. If so, enable the status-check
rule alone and leave the pull-request requirement off — the check still blocks a
direct push that fails.

---

## Resolved

- **Developer legal name.** Christopher Mahar, trading as Bloodhound Studios.
  Published in the EULA Contact section beside the address, which is what
  Apple's Minimum Terms ask for. The landing page and the privacy policy carry
  the studio name alone, which is correct for those surfaces. The check fails if
  the legal name is dropped from the EULA.
- **Governing law and forum.** Connecticut. `terms.html` clause 11 now names the
  law of the State of Connecticut and gives the state and federal courts in
  Connecticut non-exclusive jurisdiction, without displacing a consumer's local
  protections. Connecticut abolished county government in 1960 and organises its
  courts by judicial district, so naming the state rather than a county is the
  correct form. `tools/check.js` fails if clause 11 reverts.
- **Trader address.** 565 Pleasant St, Southington, CT 06489, United States.
  Published in three places: the EULA Contact section (Apple's minimum terms),
  the studio landing page (imprint, and the same details the store listings
  show), and the privacy policy as the controller's identity (GDPR Art. 13). The
  EU DSA traceability duty binds the stores rather than this site, and is
  discharged by entering the same details in both consoles. The check asserts
  all three pages carry an identical address and that no fourth page grows one.
- **Phone number.** Not published. The support email satisfies Apple's
  contact-details requirement. Both consoles will still ask for a phone
  separately for DSA trader verification; that stays in the console rather than
  on an indexed page.
- **"Fourteen languages"** (`gridinfect/index.html`). Confirmed correct.

## Standing maintenance

- **"the Lock wallet"** (`gridinfect/privacy.html`, on-device data). An
  unexplained in-game term on a privacy page. Worth renaming to something a
  store reviewer will recognise next time that page is touched.
- **SDK and package versions** in `notices.html`. Generated from build manifests
  on 17 September 2026. Regenerate and bump the "Generated" date whenever the
  dependency set moves; the three items under "Scope and limits of this notice"
  record what could not be read from the source tree.
