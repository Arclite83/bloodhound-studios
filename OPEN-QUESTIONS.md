# Open questions — Grid Infect legal and support pages

Everything else in the audit is resolved and shipped. These four need a value
from Chris. Each one has the wording already drafted; the only thing missing is
the decision. Nothing below is published yet — no placeholder text exists on any
live page, and `tools/check.js` fails the build if one appears.

---

## 1. Governing law and forum — a jurisdiction

**Where:** `gridinfect/terms.html`, clause 11.

**What shipped in the meantime.** The `TODO — set before store submission`
placeholder is gone. Clause 11 currently reads:

> This agreement is governed by the law of the jurisdiction in which Bloodhound
> Studios is established. Nothing in this clause deprives you of the protection
> given to you by the mandatory consumer law of the country where you live, or
> of your right to bring proceedings in the courts of that country.

That is valid, names no jurisdiction I was not given, and is not a placeholder,
so the EULA link is submittable today. It is weaker than a named forum: it gives
no exclusive jurisdiction, so a dispute could in principle be brought anywhere
the ordinary conflict rules allow.

**Decision needed:** the jurisdiction. For a one-person studio this is normally the
state or country of residence — for a US developer, "the State of X"; for the
UK, "England and Wales".

**Drop-in replacement for clause 11 once you have it.** Replace
`JURISDICTION-HERE` and `COURTS-HERE` and nothing else:

```html
<h2>11. Governing law</h2>
<p>This agreement is governed by the law of JURISDICTION-HERE, without regard to
its conflict of law rules, and the courts of COURTS-HERE have non-exclusive
jurisdiction over any dispute arising out of it. Nothing in this clause deprives
you of the protection given to you by the mandatory consumer law of the country
where you live, or of your right to bring proceedings in the courts of that
country.</p>
```

Keep "non-exclusive" rather than "exclusive". An exclusive forum clause against
a consumer is unenforceable in the EU and the UK, and asserting one invites a
reviewer to treat the whole clause as unfair.

---

## 2. Trader identity — a postal address

**Determination first, since the task asked where this belongs.**

The EU Digital Services Act trader-traceability duty (Articles 30 and 31) binds
the **platform**, not the developer's own site. Google Play and the App Store
collect the trader's legal name, address, phone and email in the console and
display them on the store listing. Entering them there discharges the DSA
obligation. Nothing on this site is required by the DSA.

Two other rules do put the address on this site, and they are the reason to act:

- **Apple's Minimum Terms for a developer EULA** (Schedule A of the Developer
  Program agreement) require the developer's **name and address**, plus contact
  details for user questions and complaints, to appear in the EULA itself. The
  EULA currently gives the name and the email, not the address. This is the one
  remaining gap against Apple's checklist — every other minimum term is now
  present in `terms.html` clause 9.
- **GDPR Article 13** requires the controller's identity and contact details in
  the privacy notice. Name plus a monitored email is the common reading, so
  `privacy.html` is defensible as it stands, but an address makes it solid.

**So: `gridinfect/terms.html` needs it. `index.html` is where to repeat it, as a
studio imprint.** `privacy.html` picks it up by reference.

**Decision needed:** the legal name to trade under (is the registered or legal
name "Bloodhound Studios", or is that a trading name over a personal legal
name?), a postal address, and a phone number if you want the site to carry the
same details the store listing shows.

One thing to weigh before answering: for a one-person studio this is usually a
home address, and it becomes permanently public and indexed. The normal fix is a
registered agent, a virtual business address, or a mail-forwarding box. It costs
tens of dollars a year and you will need the same address in both store consoles
regardless, so it is worth solving once. **This is the item to hand off** —
picking a registered-address provider is a bounded errand with no engineering in
it, and it is the only blocker here that does not need you specifically.

**Drop-in markup for `gridinfect/terms.html`,** replacing the current Contact
section. Fill the three blanks; delete the phone line entirely if you are not
publishing one:

```html
<h2>Contact</h2>
<p>Grid Infect is published by:</p>
<p><strong>LEGAL-NAME-HERE</strong>, trading as Bloodhound Studios<br>
STREET-ADDRESS-HERE<br>
CITY, REGION, POSTCODE, COUNTRY<br>
<a href="mailto:bloodhoundstudios@gmail.com">bloodhoundstudios@gmail.com</a><br>
PHONE-HERE</p>
<p>Questions, complaints and legal notices about the app go to the email address
above, which is answered by the developer.</p>
```

**And for `index.html`,** appended after the existing Contact paragraph:

```html
<h2>Studio details</h2>
<p class="meta">LEGAL-NAME-HERE, trading as Bloodhound Studios<br>
STREET-ADDRESS-HERE<br>
CITY, REGION, POSTCODE, COUNTRY<br>
<a href="mailto:bloodhoundstudios@gmail.com">bloodhoundstudios@gmail.com</a></p>
<p class="meta">These are the trader details shown on the studio's Google Play
and App Store listings.</p>
```

---

## 3. Make a failing check actually block the merge

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

## 4. Three facts I could not verify against the game repo

Not blockers, and nothing contradicts the ground truth I was given. Flagged
because they are live claims on compliance surface that came from the previous
draft and I had no source for:

- **"Fourteen languages"** (`gridinfect/index.html`). Confirm the count. The
  fonts listed in `notices.html` cover Latin, Greek, Cyrillic, Japanese, Korean,
  Simplified and Traditional Chinese, Arabic and Hebrew, which is consistent
  with fourteen but does not prove it.
- **"the Lock wallet"** (`gridinfect/privacy.html`, on-device data). An
  unexplained in-game term on a privacy page. Confirm it is still what the
  feature is called in the shipped build, or rename it to something a reviewer
  will recognise.
- **SDK and package versions** in `notices.html`. Generated from build manifests
  on 17 September 2026. Regenerate and bump the "Generated" date whenever the
  dependency set moves; the three items under "Scope and limits of this notice"
  on that page record what could not be read from the source tree.
