# SEO / EEAT / Ad-Readiness Report — The Margin

Date: 2026-07-07
Site: https://finblog-murex.vercel.app

## What changed

### Phase 0 — Audit findings
- Stack: static HTML/CSS/JS, no framework, no build step, deployed to Vercel as raw files.
- Every page had a title/description but they were under-length (19–41 chars vs. the ~50–60 target) and zero pages had canonical tags, Open Graph, Twitter Cards, or structured data.
- **The glossary's 104 term definitions were rendered entirely client-side.** The raw HTML shipped to crawlers contained only the search UI (~133 words) — the actual content most worth indexing wasn't visible to non-JS crawlers or slow/JS-budget-limited ones. This was the highest-priority fix.
- Fonts loaded via `@import` inside `base.css` — sequential and render-blocking, no `preconnect`.
- No About/Contact/Disclaimer/Editorial Standards pages, no author byline anywhere, "SEC EDGAR" mentioned as plain text three times, never as a link.

### Phase 1 — Technical SEO
- Rewrote every page's `<title>` (now 48–59 chars) and meta description (now 140–157 chars).
- Added `rel="canonical"` to all pages, pointing at `https://finblog-murex.vercel.app`.
- Added full Open Graph + Twitter Card tags to every page (`og:type` is `article` for the guide and the 3 research pages, `website` elsewhere).
- Generated a real 1200×630 OG image (`/assets/images/og-default.png`) — a branded card matching the site's design system, not a stock placeholder.
- Moved font loading from `@import` in CSS to `<link rel="preconnect">` + `<link rel="stylesheet">` in each `<head>` — parallel fetching instead of sequential, render-blocking `@import`.
- Added `sitemap.xml` (12 URLs) and `robots.txt` at the site root.

### Phase 2 — Structured data
- `Organization` + `WebSite` JSON-LD on every page. The `WebSite`'s `SearchAction` is **genuinely functional**, not decorative — `glossary.js` now reads a `?q=` param and pre-fills/runs the search on load.
- `BreadcrumbList` on every interior page.
- `Article` schema (with `author`, `publisher`, `datePublished`/`dateModified`, and `about` naming the ticker) on the financial-statements guide and all 3 research pages.
- `Person` schema for the pen name "Marcus Mase," with `knowsAbout` and an honestly-framed `hasCredential` (CPA — not CFA charterholder, not a fabricated designation).
- **Fixed the glossary crawlability gap directly**: all 104 terms are now statically rendered into `glossary/index.html` (verified with JavaScript disabled — same 104 entries render either way). `glossary.js` still re-renders on top for live search/filter; the static markup is what crawlers and no-JS visitors see immediately.
- Added a `DefinedTermSet` (containing 104 `DefinedTerm` entries) to the glossary page — a strong fit for definition-style featured snippets and AI answer engines.

### Phase 3 — EEAT
- Built `/about/`, `/contact/`, `/disclaimer/`, `/editorial-standards/` for the pen name **Marcus Mase** ("a CPA who works in tech, writing about markets and corporate finance"). No CFA-charterholder claim, no fabricated legal name or photo — the avatar is a plain "MM" monogram.
- Added a byline (`By Marcus Mase · Published · Updated`) under the headline, and a full author bio box linking to `/about/` and `/editorial-standards/`, on the guide and all 3 research pages.
- Converted the three "SEC EDGAR" plain-text mentions on the research pages, plus one in the Disclaimer page, into real outbound links to SEC EDGAR's company-filing search.
- Added footer links to About / Contact / Disclaimer / Editorial Standards across **all 12 pages** (also had to widen `.footer-grid` from 4 to 5 columns).
- Editorial Standards page explicitly discloses AI-assisted drafting under human direction, independence from advertisers (contextual ads only, no pay-for-coverage), and a corrections policy.

### Phase 4 — Ad-revenue readiness (placeholders only, nothing live)
- Built a `.ad-slot` component: fixed-dimension (336×280 in-content, 728×90 post-content, both collapsing to 300×250 on mobile), dashed border, "ADVERTISEMENT" corner label — impossible to mistake for live content, zero CLS risk since the box reserves its space whether or not a real ad ever loads into it.
- Placed slots only on the 4 substantial content pages (the guide + 3 research pieces, all 600+ words) — deliberately **not** on the thin navigational hub pages (glossary/guides/research index, homepage), which is the actually-compliant choice under AdSense's content policy, not a shortcut.
- No slot sits above the fold with no content around it.
- Added a stub `ads.txt` at the root with a `TODO` marking exactly where your AdSense publisher ID goes.
- I did **not** implement a literal sidebar slot — this layout is intentionally single-column with no sidebar anywhere, so I used a second in-flow position (post-content, pre-footer) instead of forcing a sidebar into a design that doesn't have one.

### An unrelated bug found and fixed during verification
While screenshot-testing the new components on real mobile (touch) emulation, the mobile nav overlay (meant to stay off-screen until the hamburger is tapped) intermittently became partially visible after scrolling — its `position:fixed; inset:0` was resolving its height against something other than the viewport once nested inside the also-fixed header. Fixed by giving it an explicit `height:100vh`/`100dvh` instead of relying on `inset:0`'s implicit height, and by disabling Lenis's touch-transform scroll path (`syncTouch`/`smoothTouch: false`), since a smooth-scroll library's touch-transform mode is a common source of exactly this class of fixed-positioning bug. Verified fixed on real touch-device emulation before and after.

## Verified before deploying
- All 12 pages render with zero console/page errors, desktop and mobile (iPhone 13 emulation).
- Every JSON-LD block across all 12 pages parses as valid JSON.
- Glossary shows all 104 terms with JavaScript fully disabled.
- The `WebSite` SearchAction (`/glossary/?q=hedge`) actually filters and pre-fills the search box.
- No layout shift risk from ad slots (fixed dimensions, verified in the browser).

## What's left for you to do manually

1. **Contact email.** `/contact/` currently shows `contact@themargin.example` — a deliberately non-functional placeholder (the `.example` domain is reserved by RFC 2606 specifically so it can never resolve). Replace it with a real address or a form service (e.g. Formspier/Formspree) before launch.
2. **Google Search Console.** Verify the domain, then submit `https://finblog-murex.vercel.app/sitemap.xml`.
3. **Bing Webmaster Tools.** Same sitemap submission — worth doing since Bing (and some AI crawlers) don't execute JS as reliably as Google.
4. **AdSense application.** Apply once there's a few weeks of real traffic/content history. When approved:
   - Add your publisher ID to `/ads.txt` (uncomment the line, replace `PUB-ID-HERE`).
   - Paste the AdSense loader script into each page's `<head>` (same spot across all pages, right before `</head>`).
   - Replace the placeholder `<div class="ad-slot ...">` contents with the actual `<ins class="adsbygoogle">` unit for each `data-ad-slot`.
5. **Custom domain.** Everything currently hardcodes `https://finblog-murex.vercel.app` as the canonical base (in every `<link rel="canonical">`, every OG/Twitter tag, every JSON-LD `@id`/URL, `sitemap.xml`, and `robots.txt`). If you move to a custom domain, all of these need a find-and-replace — happy to do that pass when you're ready.
6. **Position disclosures.** The Disclaimer page states a *policy* (disclose positions when they exist) without asserting you currently hold or don't hold any position — that's a fact only you can attest to. Update it if/when relevant.
7. **Decide on real vs. placeholder credentials.** Everything is framed as "Marcus Mase, CPA" per your instructions. If any biographical detail in `/about/` needs adjusting, that page and the `Person` JSON-LD (repeated on every article page) are the two places to change it.

## Backlog / content gaps (not urgent, worth knowing about)
- No `FAQPage` schema anywhere — there's no genuine FAQ content on the site yet, so I didn't fabricate one just to attach schema. If you add a real FAQ section (e.g., to the guides hub or About page), that's a good candidate for `FAQPage` markup later.
- Only 1 of 4 planned guides is written (the other 3 are marked "Coming soon" on `/guides/`) — thin future content, not a current problem.
- CSS/JS aren't minified (no build step exists to do this without adding tooling) — a minor performance nice-to-have, not urgent at current traffic levels.
- The `og-default.png` is reused identically across all 12 pages. Distinct per-article OG images (e.g. one per research company) would be a nice future differentiator for social shares, not required.
