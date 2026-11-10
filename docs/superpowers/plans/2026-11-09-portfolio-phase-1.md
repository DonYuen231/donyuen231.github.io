# Portfolio Site Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 2020 site with the Astro portfolio from the spec. This phase covers every page, the design system, the content schema, CI and deploy, and the MNIST **card** demo (draw, then see the top guess).

**Architecture:** A static Astro 7 site with content collections (MDX plus Zod) and plain CSS tokens. The only client-side code is one React island for the MNIST card. Its model and preprocessing are framework-free TypeScript modules, so Phase 2 (the full visualizer) can reuse them. GitHub Actions runs every check on pull requests and deploys `main` to GitHub Pages.

**Tech Stack:** Node 24 LTS (CI), Astro 7.4, `@astrojs/react` 7, `@astrojs/mdx` 8, `@astrojs/sitemap` 3, React 19, TypeScript 6.0 (strict), Vitest 5, Playwright 1.65 with `@axe-core/playwright`, ESLint 10 with `typescript-eslint` and `eslint-plugin-astro`, Prettier 3 with `prettier-plugin-astro`, Fontsource IBM Plex, linkinator, `@lhci/cli`.

**Spec:** [docs/design-spec.md](../../design-spec.md)

**Phases (not in this plan):**
- Phase 2: the full MNIST visualizer ("Watch it think", Section 4.1 parts 1–2, the state machine, and backward pass fixture tests).
- Phase 3: the photo explorer call diagram (Section 4.2).

In this phase, the photo explorer ships as a project page with `demo: "none"`. Phase 3 changes it to `"saved-runs"`.

## Global Constraints

- The repo is `DonYuen231/donyuen231.github.io`. Work on branch `astro-rebuild`; tag `old-site-2020` is already pushed. Set `site: "https://donyuen231.github.io"` and no `base`.
- TypeScript is held at `~6.0.3`, because `@astrojs/check` needs `^5 || ^6` and `typescript-eslint` needs `<6.1`. Use exact versions in `package.json` and commit the lockfile.
- `.nvmrc` holds `24`. CI uses Node 24. Local development on Node 25 is allowed, because Astro needs `>=22.23.4`.
- Use React only for the MNIST island. All other pages are Astro components with scoped styles plus `src/styles/tokens.css` and `global.css`.
- Use the color tokens exactly as listed in spec Section 2. Amber is only for links and demo highlights, and entry labels are navy.
- Fonts are IBM Plex Sans (400, 600, 700) and IBM Plex Mono (400, 500, 700), loaded through Fontsource with `font-display: swap`. Never request Google Fonts.
- Content is at most 1120px wide, with 32px side padding, or 20px at 640px and below. Cards have a 10px radius, demo panels 6px, and buttons square corners and at least 48px height. Every link and button is at least 44px tall.
- The menu order is Work, About, Experience, Notes (shown only when a non-draft note exists), Resume, Contact. Contact goes to `#contact`, the footer.
- Never use the words "entry-level". Never set cookies or use local storage. No tracking embeds.
- The footer reads exactly `© 2026 Don Yuen` and links to `/privacy/`.
- Unknown values use the bracket placeholders `[EMAIL]`, `[LINKEDIN_URL]` and `[RESUME_CONTENT]`. The CI placeholder scan is supposed to fail on them, which blocks launch until they're filled in. Draft text for the headline, intro and About page goes in as plain sentences without brackets, and the launch checklist covers rewriting it.
- The MNIST model files come from `DonYuen231/mnist-neural-network` branch `export-weights`, folder `export/`: `weights.bin` (437,544 bytes), `model.json` (version `2026-11-09-ae8f1bc`) and `fixtures.json`. Do the math in JS numbers (float64) on the float32 weights.
- MNIST normalization: values from 0 to 1, a 28×28 grid flattened row by row, 0 for background and 1 for ink. The card reads ink from the canvas alpha channel, so no color inversion is needed.

## Review Focus

1. **Empty or tiny drawing.** Pressing "Guess" (or lifting the pen) with no ink, or a single dot, shows "Draw a digit first". It never shows NaN or a guess. Tested in Task 6 (`preprocess` returns `null`) and Task 7 (e2e).
2. **Strokes that leave the canvas, and cancelled touches.** Dragging past the edge or a `pointercancel` ends the stroke cleanly, and the next stroke starts fresh. Tested in Task 7 (e2e).
3. **Missing or truncated model files.** A 404, or a `weights.bin` whose length doesn't match `model.json`, shows "Demo couldn't load" with the code link. Tested in Task 6 (`loadModel` throws) and Task 7 (e2e with a blocked route).
4. **Island after a view-transition navigation.** Going home, then to a project, then back with the browser leaves the card working. Tested in Task 7 (e2e).
5. **320px-wide phones.** No page scrolls sideways, and the menu stays on one row. Tested in Task 5 (e2e loop over every page).

---

## File map

```
astro.config.mjs, tsconfig.json, package.json, .nvmrc, eslint.config.js, .prettierrc,
playwright.config.ts, vitest.config.ts, lighthouserc.json, LICENSE, .gitignore
src/site.ts                      name, email, links, menu (one place for footer/header data)
src/styles/tokens.css, global.css
src/layouts/BaseLayout.astro     <head>, ClientRouter, Header, Footer, skip link
src/layouts/ProjectLayout.astro  project page structure
src/components/Header.astro, Footer.astro, Button.astro, BackgroundNote.astro,
               Figure.astro, ProjectCard.astro, ProblemApproachResult.astro
src/components/mnist/model.ts, preprocess.ts, MnistCard.tsx, mnist-card.css
src/content/schemas.ts           Zod schemas (pure, imported by tests too)
src/content.config.ts            collections using schemas.ts
src/content/projects/mnist-neural-network.mdx, historic-photo-explorer.mdx
src/content/notes/.gitkeep
src/lib/content.ts               sorting, featured, next project, notes visibility
src/lib/inline-markdown.ts       **bold** and [links] for problem/approach/result
src/assets/projects/mnist/       training_curves.png, confusion_matrix.png, misclassified.png
src/pages/index.astro, about.astro, experience.astro, resume.astro, privacy.astro, 404.astro,
          projects/index.astro, projects/[slug].astro, notes/index.astro, notes/[slug].astro
public/models/mnist/weights.bin, model.json, samples.json
public/favicon.svg, og-default.png, robots.txt   (resume.pdf added by Don)
scripts/extract-mnist-samples.mjs, check-placeholders.mjs, make-og.mjs
tests/unit/*.test.ts, tests/fixtures/mnist-fixtures.json, tests/e2e/*.spec.ts
.github/workflows/ci.yml, deploy.yml
```

---

### Task 1: Clear the old site and scaffold the project

**Files:**
- Delete: every tracked file from the old site (`git rm -r` on everything except `docs/`)
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `.nvmrc`, `.gitignore`, `eslint.config.js`, `.prettierrc`, `vitest.config.ts`, `LICENSE`, `src/pages/index.astro` (temporary "Hello"), `tests/unit/smoke.test.ts`

**Interfaces:**
- Produces these npm scripts, used by every later task and by CI: `dev`, `build`, `preview`, `check` (`astro check`), `lint` (`eslint .`), `format:check` (`prettier --check .`), `test` (`vitest run`), `test:e2e` (`playwright test`), `check:placeholders`, `check:links`.

- [ ] **Step 1: Remove the old site.** Run `git rm -r -q -- . ':!docs'`. Expected: `git ls-files` lists nothing outside `docs/`.
- [ ] **Step 2: Add the tooling.** Install the exact versions from the Tech Stack line, plus `@types/react`, `@types/react-dom` 19.3.0, `jsdom`, and `yaml` (dev, used by the content tests). `astro.config.mjs` sets `site`, `integrations: [react(), mdx(), sitemap({ filter: (p) => !p.includes('/404') })]`, `trailingSlash: 'always'`. `tsconfig.json` extends `astro/tsconfigs/strict`. Set `jsx: react-jsx` and `jsxImportSource: react`.
- [ ] **Step 3: Write `LICENSE`.** The MIT license covers the code, with copyright "2026 Don Yuen". Add a section saying written content (project write-ups, notes and the About text) is "All rights reserved".
- [ ] **Step 4: Write the smoke test** `tests/unit/smoke.test.ts`: `expect(1 + 1).toBe(2)`. Vitest includes `tests/unit/**/*.test.ts` and uses the `node` environment.
- [ ] **Step 5: Verify.** Run `npm run build; npm test; npm run check; npm run lint; npm run format:check`. Expected: all exit 0, and `dist/index.html` exists.
- [ ] **Step 6: Commit.** `git add -A; git commit -m "chore: replace 2020 site with Astro scaffold"`

---

### Task 2: Design tokens, base layout, header, footer and button

**Files:**
- Create: `src/styles/tokens.css`, `src/styles/global.css`, `src/site.ts`, `src/layouts/BaseLayout.astro`, `src/components/Header.astro`, `src/components/Footer.astro`, `src/components/Button.astro`, `public/favicon.svg`, `public/robots.txt`, `playwright.config.ts`, `tests/e2e/layout.spec.ts`
- Modify: `src/pages/index.astro` (use BaseLayout)

**Interfaces:**
- Produces `src/site.ts`:
  ```ts
  export const SITE = { name: 'Don Yuen', url: 'https://donyuen231.github.io', email: '[EMAIL]',
    github: 'https://github.com/DonYuen231', linkedin: '[LINKEDIN_URL]' } as const;
  export interface MenuItem { label: string; href: string }
  export function menuItems(showNotes: boolean): MenuItem[]
  // Work → /projects/, About → /about/, Experience → /experience/, Notes → /notes/ (only if showNotes),
  // Resume → /resume/, Contact → #contact
  ```
- Produces `BaseLayout` props: `{ title: string; description: string; ogImage?: string; showNotes: boolean }`. It renders `<title>{title} · Don Yuen</title>`, except on the home page, where `title === 'Don Yuen'` renders just "Don Yuen". It also renders the meta description, Open Graph and Twitter tags (`og:image` defaults to `/og-default.png`), the canonical URL, `<ClientRouter />`, a skip link to `#main`, then Header, `<main id="main"><slot/></main>`, Footer.
- Produces `Button` props: `{ href?: string; variant: 'solid' | 'outline'; type?: 'button' | 'submit' }`. It renders an `<a>` when there's an `href`, otherwise a `<button>`.

- [ ] **Step 1: Write the failing e2e tests** `tests/e2e/layout.spec.ts`. `playwright.config.ts` runs projects for chromium, firefox, webkit and `Pixel 7`, and its `webServer` is `npm run build && npm run preview` on port 4321.
  ```ts
  test('menu items in order', async ({ page }) => { await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link'))
      .toHaveText(['Work', 'About', 'Experience', 'Resume', 'Contact']); });
  test('footer', async ({ page }) => { await page.goto('/');
    const f = page.locator('footer#contact');
    await expect(f).toContainText('© 2026 Don Yuen');
    await expect(f.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy/');
    await expect(f.getByRole('link', { name: 'GitHub' })).toBeVisible(); });
  test('tap targets ≥ 44px', async ({ page }) => { await page.goto('/');
    for (const el of await page.locator('header a, footer a, button').all())
      expect((await el.boundingBox())!.height).toBeGreaterThanOrEqual(44); });
  test('menu is one row at 360px', async ({ page }) => { await page.setViewportSize({ width: 360, height: 740 });
    await page.goto('/'); const ys = await page.locator('nav[aria-label="Main"] a')
      .evaluateAll(els => els.map(e => e.getBoundingClientRect().top));
    expect(new Set(ys).size).toBe(1); });
  ```
- [ ] **Step 2: Run them to confirm they fail.** Run `npx playwright test tests/e2e/layout.spec.ts --project=chromium`. Expected: FAIL (there's no nav yet).
- [ ] **Step 3: Implement the tokens, layout, header, footer and button.**
  - `tokens.css` holds the 16 color tokens from spec Section 2, plus `--content-max: 1120px`, `--gutter: 32px` (20px at max-width 640px), `--radius-card: 10px`, `--radius-demo: 6px`, `--font-sans`, `--font-mono`.
  - `global.css` imports the Fontsource weights listed in Global Constraints. It sets the body to 17px with line-height 1.5 on `--paper`, with a 24px grid drawn by two `linear-gradient`s in `--grid-line`. It sets the heading sizes from the spec's font table. Focus is `outline: 2px solid var(--amber); outline-offset: 2px`, and `.on-dark :focus-visible` uses `--amber-bright`. There's a `prefers-reduced-motion` block that sets transition and animation durations to 0.01ms.
  - Header: a navy bar with 8px top and bottom padding and a mono logo "don yuen". The nav (`aria-label="Main"`) uses `overflow-x: auto`, `flex-wrap: nowrap`, and a hidden scrollbar. "Contact" is `--amber-bright`. The current page link gets `aria-current="page"`.
  - Footer: `id="contact"`, navy, with email (`mailto:`), GitHub, LinkedIn and Privacy links in `--amber-bright`, then `© 2026 Don Yuen`.
  - `favicon.svg`: the mono letters "dy" in `--amber-bright` on a `--navy` square.
  - `robots.txt`: allow everything, plus `Sitemap: https://donyuen231.github.io/sitemap-index.xml`.
- [ ] **Step 4: Run the tests to confirm they pass.** Run `npx playwright test tests/e2e/layout.spec.ts`. Expected: PASS on all 4 projects.
- [ ] **Step 5: Commit.** `git commit -am "feat: design tokens, base layout, header, footer, button"` (run `git add` on the new files first)

---

### Task 3: Content schemas and content helpers

**Files:**
- Create: `src/content/schemas.ts`, `src/content.config.ts`, `src/lib/content.ts`, `src/lib/inline-markdown.ts`, `src/content/notes/.gitkeep`, `tests/unit/schemas.test.ts`, `tests/unit/content.test.ts`, `tests/unit/inline-markdown.test.ts`

**Interfaces:**
- Produces `schemas.ts` (imports `z` from `astro/zod`): `projectSchema` and `noteSchema` (with `project` as a plain string here, so the tests can use it), following every rule in spec Section 3. `demo` is `z.enum(['mnist','saved-runs','video','image','none']).default('none')`, `summary` is `.max(160)`, and `tags` is `.min(1)`. `image` is `{ src: string, alt: string (min 1) }`, optional. `repo` and `live` are `z.url()`. `draft` and `featured` default to `false`.
- Produces `content.config.ts`: collections `projects` and `notes`, using `glob({ pattern: '**/*.mdx', base: './src/content/<name>' })`. The notes collection overrides `project` with `reference('projects')`.
- Produces `src/lib/content.ts`. These are pure functions over plain arrays, so they can be unit tested:
  ```ts
  export interface HasEntry { id: string; data: { entry: number; draft: boolean; featured: boolean } }
  export function published<T extends { data: { draft: boolean } }>(items: T[]): T[]
  export function byEntryDesc<T extends HasEntry>(items: T[]): T[]          // highest entry first
  export function featured<T extends HasEntry>(items: T[]): T[]            // published, featured, sorted
  export function nextProject<T extends HasEntry>(items: T[], id: string): T | null
  // next lower entry, wrapping to the highest; null when fewer than 2 published projects
  export function duplicateEntries(entries: number[]): number[]
  export async function loadSiteContent(): Promise<{ projects: CollectionEntry<'projects'>[]; notes: CollectionEntry<'notes'>[]; showNotes: boolean }>
  // the only function that calls getCollection; returns published, sorted items
  ```
- Produces `inlineMarkdown(src: string): string`. It HTML-escapes everything, then turns `**x**` into `<strong>x</strong>` and `[t](https://…)` into `<a href="…">t</a>` (only `http`, `https` and `/` links). Nothing else is converted.

- [ ] **Step 1: Write the failing unit tests.**
  - `schemas.test.ts`:
    - The spec's example frontmatter parses.
    - A 161-character summary fails.
    - `tags: []` fails.
    - An `image` without `alt` fails.
    - `demo` defaults to `'none'`, and `demo: 'gif'` fails.
    - `it('no two project files share an entry')` reads every `src/content/projects/*.mdx`, parses the frontmatter with `yaml`, runs `projectSchema.parse` on each, and expects `duplicateEntries(entries)` to equal `[]`.
  - `content.test.ts`:
    - `byEntryDesc` puts entries 1, 3, 2 in the order 3, 2, 1.
    - `published` drops drafts.
    - `featured` drops drafts and entries that aren't featured.
    - `nextProject` with entries 3, 2, 1 returns 2 for 3, and 3 for 1 (it wraps). With a single project it returns `null`.
    - `duplicateEntries([1,2,2,3,3])` returns `[2,3]`.
  - `inline-markdown.test.ts`:
    - `'**98.32%** on'` becomes `'<strong>98.32%</strong> on'`.
    - `'<script>'` is escaped.
    - `'[code](https://x.dev)'` becomes an anchor.
    - `'[x](javascript:alert(1))'` comes out as plain escaped text.
- [ ] **Step 2: Run them to confirm they fail.** Run `npm test`. Expected: FAIL, because the modules don't exist yet.
- [ ] **Step 3: Implement** `schemas.ts`, `content.config.ts`, `content.ts` and `inline-markdown.ts` as specified in the Interfaces block. The entry test passes with zero project files for now; Task 5 adds the files.
- [ ] **Step 4: Run them to confirm they pass.** Run `npm test; npm run check`. Expected: PASS, with no type errors.
- [ ] **Step 5: Commit.** `git commit -m "feat: content schemas and helpers"`

---

### Task 4: Card and write-up components

**Files:**
- Create: `src/components/ProjectCard.astro`, `src/components/ProblemApproachResult.astro`, `src/components/BackgroundNote.astro`, `src/components/Figure.astro`, `tests/unit/components.test.ts`
- Tests render the components to HTML with Astro's container API (`experimental_AstroContainer` from `astro/container`), with Vitest's `getViteConfig` from `astro/config` in `vitest.config.ts`. The layout checks (positions and sizes) run in Task 5's e2e tests, against the real pages.

**Interfaces:**
- Consumes `inlineMarkdown` (Task 3) and `Button` (Task 2).
- Produces `ProjectCard` props: `{ project: CollectionEntry<'projects'>; variant: 'full' | 'compact' }`, plus a default slot for the demo (full variant only).
  - Header strip: `Entry 0N` in navy mono, the tags, and the year. It has `transition:name={`project-${id}-header`}`.
  - The h3 title links to `/projects/<id>/` and has `transition:name={`project-${id}-title`}`.
  - The full variant adds ProblemApproachResult, then "Open project" (solid Button) and "View the code" (outline Button to `repo`) at the bottom of the text column, with the demo column beside them. At 640px and below the demo goes on top (`order: -1`).
  - The compact variant shows the title, summary, tags and year.
  - The card itself is never a link.
- Produces `ProblemApproachResult` props: `{ problem: string; approach: string; result: string }`. It renders a `<dl>`. Each row is a wrapping flex row with a 110px mono `<dt>` and a `<dd>` with `min-width: 260px`, filled with `set:html={inlineMarkdown(...)}`.
- Produces `BackgroundNote`: a slot inside a box with a dashed `--amber` border, with text in `--text-soft`.
- Produces `Figure` props: `{ src: ImageMetadata; alt: string; caption: string }`. It renders `<figure class="fig">` with an Astro `<Image>` and a `<figcaption>`. Numbering uses CSS counters: the write-up wrapper sets `counter-reset: fig`, `.fig` sets `counter-increment: fig`, and `figcaption::before` adds `content: "Fig. " counter(fig) ". "`.

- [ ] **Step 1: Write the failing unit tests** `tests/unit/components.test.ts`. Use a fake project entry (`id: 'demo-proj'`, `entry: 3`, tags `['python']`, `result: '**98%** done'`).
  - The full card's HTML contains `Entry 03`, an `<h3>` with an `<a href="/projects/demo-proj/">`, both `transition:name` values (as `data-astro-transition-scope` attributes), `<strong>98%</strong>`, "Open project" and "View the code". The root element is not an `<a>`.
  - The compact card has no `<dl>` and no "Open project".
  - ProblemApproachResult renders 3 `<dt>`s with the text Problem, Approach and Result.
  - Figure renders a `figure.fig` containing a `figcaption` with the caption text, and the `img` has the given `alt`.
- [ ] **Step 2: Run them to confirm they fail.** Run `npm test`. Expected: FAIL.
- [ ] **Step 3: Implement the four components** as specified in the Interfaces block.
- [ ] **Step 4: Run them to confirm they pass.** Run `npm test`. Expected: PASS.
- [ ] **Step 5: Commit.** `git commit -m "feat: project card, P/A/R, background note, figure"`

---

### Task 5: Pages and project content

**Files:**
- Create: every file in `src/pages/` listed in the file map, `src/layouts/ProjectLayout.astro`, `src/content/projects/mnist-neural-network.mdx`, `src/content/projects/historic-photo-explorer.mdx`, `src/assets/projects/mnist/*.png` (copied from the MNIST repo's `figures/`), `scripts/make-og.mjs`, `public/og-default.png`, `tests/e2e/pages.spec.ts`
- Modify: `src/pages/index.astro` (the real home page)

**Interfaces:**
- Consumes `loadSiteContent`, `featured` and `nextProject` (Task 3), plus `ProjectCard`, `BackgroundNote`, `Figure` and `BaseLayout`.
- Produces project ids `mnist-neural-network` (entry 1) and `historic-photo-explorer` (entry 2). Both are `year: 2026` and `featured: true`. The demo is `mnist` for the first and `none` for the second.
- Produces a demo element with `id="demo"` on the project page. Task 7 and Phase 2 mount into it.

- [ ] **Step 1: Write the failing e2e tests** `tests/e2e/pages.spec.ts`. `PAGES` is `['/', '/projects/', '/projects/mnist-neural-network/', '/projects/historic-photo-explorer/', '/about/', '/experience/', '/resume/', '/privacy/', '/notes/', '/404/']`.
  ```ts
  test('unique titles and descriptions', …)        // collect <title> and meta description for every page; check uniqueness and non-empty
  test('one h1 and headings in order', …)          // for each page: exactly one h1; no heading level skips
  test('no horizontal scroll at 320px', …)         // for each page: documentElement.scrollWidth <= clientWidth
  test('axe: zero violations', …)                  // AxeBuilder({ page }).analyze() → violations toEqual([]) for each page
  test('home lists featured projects highest entry first', …) // h3 texts = [photo explorer title, MNIST title]
  test('card title opens project page', …)         // click MNIST h3 link → URL /projects/mnist-neural-network/, h1 = title, #demo visible
  test('next project wraps', …)                    // on MNIST (entry 1), "Next project" → /projects/historic-photo-explorer/
  test('notes hidden from menu', …)                // no "Notes" link in nav
  test('404 page', …)                              // goto /does-not-exist → text "page not found", links to / and /projects/
  test('no entry-level wording', …)                // every page body text lacks /entry-level/i
  test('card links sit at the bottom of the text column', …) // home at 1280px: "Open project" bottom within 1px of the text column bottom
  test('demo above text on phones', …)             // home at 375px: MNIST card's #demo slot top < its <dl> top
  test('P/A/R labels stack on narrow cards', …)    // home at 320px: every <dt> bottom <= its <dd> top
  test('figures numbered', …)                      // MNIST page (chromium): figcaption innerTexts start "Fig. 1", "Fig. 2", "Fig. 3"
  test('card body is not a link', …)               // click the card's header strip → URL unchanged
  ```
- [ ] **Step 2: Run them to confirm they fail.** Run `npx playwright test tests/e2e/pages.spec.ts --project=chromium`. Expected: FAIL.
- [ ] **Step 3: Build the pages.**
  - **Home:** an h1 "Don Yuen", then the draft intro line "I build software and like to show how it works.", then a BackgroundNote with a two-sentence draft background. Then the h2 "Selected work", with one full ProjectCard per featured project, and the `mnist` demo slot left as `<div id="demo">` until Task 7.
  - **`/projects/`:** compact cards for every published project.
  - **`projects/[slug].astro`:** `getStaticPaths` covers published projects only. It renders ProjectLayout, which shows the header strip and h1 with the same `transition:name` values, then `#demo`, then ProblemApproachResult, then `<Content />` wrapped in the counter element. Next comes a "Related notes" list when any published note has `project` set to this id, then the "Next project" link (hidden when `nextProject` is `null`). The page description is `summary`, and `ogImage` is used when set.
  - **About and Experience:** draft text. Experience holds `[RESUME_CONTENT]` until Don sends his history.
  - **Resume:** `[RESUME_CONTENT]` plus a "Download PDF" Button linking to `/resume.pdf`.
  - **Privacy:** the bullets from spec Section 7, the link to GitHub's privacy statement, and the note on written content's license.
  - **404:** says "page not found" and links home and to projects.
  - **Notes:** the index and `[slug]` pages over published notes. The index shows "No notes yet." when there are none.
- [ ] **Step 4: Write both MDX files.** Use the headings Overview, How it works, Results, What I'd change, Links, in that order, drafted from each repo's README and write-up.
  - **MNIST:** `problem`, `approach` and `result` come from the spec's example. The page uses the three figures from the repo. It states that 98.32% is test-set accuracy and that hand-drawn digits are usually harder. It credits the dataset to Yann LeCun, Corinna Cortes and Christopher J.C. Burges, with a link to their MNIST page.
  - **Photo explorer:** `result` is "A stricter prompt and thumbnail detection raised description accuracy from 4.45 to 4.90 out of 5 on a 20-photo rubric." `repo` is `https://github.com/DonYuen231/historic-photo-explorer`.
- [ ] **Step 5: Add the social preview image.** `scripts/make-og.mjs` uses Playwright to screenshot a 1200×630 inline HTML page (navy, the name in Plex Sans, and the line "Projects with demos you can try" in Plex Mono) to `public/og-default.png`. Run it once and commit the PNG.
- [ ] **Step 6: Run the tests to confirm they pass.** Run `npx playwright test; npm test; npm run check`. Expected: PASS, including the axe and 320px tests on all 4 browser projects.
- [ ] **Step 7: Commit.** `git commit -m "feat: all pages and launch project content"`

---

### Task 6: MNIST model and preprocessing (framework-free)

**Files:**
- Create: `public/models/mnist/weights.bin`, `public/models/mnist/model.json`, `tests/fixtures/mnist-fixtures.json` (the export's `fixtures.json`, kept out of `public/`), `scripts/extract-mnist-samples.mjs`, `public/models/mnist/samples.json`, `src/components/mnist/model.ts`, `src/components/mnist/preprocess.ts`, `tests/unit/model.test.ts`, `tests/unit/preprocess.test.ts`

**Interfaces:**
- Produces `model.ts`:
  ```ts
  export interface ModelMeta { version: string; layers: number[]; learningRate: number; testAccuracy: number;
    order: { name: 'W1'|'b1'|'W2'|'b2'|'W3'|'b3'; shape: number[] }[] }
  export interface Model { meta: ModelMeta; W: Float32Array[]; b: Float32Array[] }   // W[l] row-major (in, out)
  export interface ForwardResult { z: Float64Array[]; a: Float64Array[]; logits: Float64Array; probs: Float64Array }
  // a[0] = input (784), a[1] = relu(z[0]) (128), a[2] = relu(z[1]) (64); logits = z[2]
  export function parseModel(meta: ModelMeta, buffer: ArrayBuffer): Model   // throws Error('weights.bin length mismatch') if bytes ≠ 4 × total
  export async function loadModel(baseUrl = '/models/mnist/'): Promise<Model> // fetches model.json + weights.bin; throws on !ok
  export function forward(model: Model, x: ArrayLike<number>): ForwardResult // softmax with max-subtraction
  export function topGuess(probs: ArrayLike<number>): { digit: number; p: number }
  ```
  Read the weights with `DataView.getFloat32(offset, true)`, so the little-endian byte order is explicit.
- Produces `preprocess.ts`:
  ```ts
  export interface PreprocessResult { crop: { x: number; y: number; w: number; h: number };
    scaled: Float64Array; scaledSize: { w: number; h: number };   // longest side 20
    shift: { dx: number; dy: number }; output: Float64Array }      // 784 values in [0, 1]
  export function inkFromAlpha(rgba: Uint8ClampedArray, width: number, height: number): Float64Array // alpha / 255
  export function preprocess(ink: Float64Array, width: number, height: number): PreprocessResult | null
  ```
  These are the steps, matching how MNIST itself was prepared. `null` means fewer than 3 pixels have `ink > 0.1`.
  1. Crop to the bounding box of pixels with `ink > 0.1`.
  2. Resize with area averaging so the longest side is 20 and the aspect ratio is kept (round the short side, minimum 1).
  3. Paste the result centered on a 28×28 grid.
  4. Find the centre of mass and shift the grid by `round(14 - cx)` and `round(14 - cy)`, dropping pixels that land outside it.
  5. Clamp every value to [0, 1].
- Produces `samples.json`: `[{ label: number; index: number; pixels: number[] }]`, 10 entries sorted by label.

- [ ] **Step 1: Copy the model files.** Run `gh api` with `-H "Accept: application/vnd.github.raw"` against `repos/DonYuen231/mnist-neural-network/contents/export/<file>?ref=export-weights` once for each of the three files. Check that `weights.bin` is 437,544 bytes. Then write `scripts/extract-mnist-samples.mjs`, which reads `tests/fixtures/mnist-fixtures.json` and writes `.samples`. Run it.
- [ ] **Step 2: Write the failing unit tests.**
  - `model.test.ts`:
    - `parseModel` on a buffer 4 bytes short throws `'weights.bin length mismatch'`.
    - For each of the 20 `forward` fixtures, every value of `forward(model, pixels).probs` is within `1e-5` of the fixture's probabilities, and `topGuess` agrees with the argmax of the fixture's probabilities.
    - For the `backward` fixture image, the logits are within `1e-4` of `fixtures.backward.logits`.
  - `preprocess.test.ts`:
    - An all-zero 280×280 canvas returns `null`, and so does a single dot.
    - A filled 100×40 rectangle placed at (150,200) on a 280×280 canvas gives `scaledSize` `{ w: 20, h: 8 }`, and the output's centre of mass is within 0.5 of (14, 14).
    - Every output value is between 0 and 1, and the output has length 784.
    - Integration: for each of the 10 samples, scale the 28×28 pixels up 10× by nearest neighbour into a 280×280 ink grid, run `preprocess` and then `forward`, and check that `topGuess(...).digit === label`.
- [ ] **Step 3: Run them to confirm they fail.** Run `npm test`. Expected: FAIL, because the modules don't exist yet.
- [ ] **Step 4: Implement `model.ts` and `preprocess.ts`** as specified in the Interfaces block.
- [ ] **Step 5: Run them to confirm they pass.** Run `npm test`. Expected: PASS. If the integration test fails for a sample, stop and report rather than loosening the test: it means preprocessing doesn't match MNIST.
- [ ] **Step 6: Commit.** `git commit -m "feat: MNIST model loading, forward pass, preprocessing"`

---

### Task 7: MNIST card island

**Files:**
- Create: `src/components/mnist/MnistCard.tsx`, `src/components/mnist/mnist-card.css`, `tests/e2e/mnist-card.spec.ts`
- Modify: `src/pages/index.astro` and `src/layouts/ProjectLayout.astro`, so that `demo === 'mnist'` renders `<MnistCard client:visible codeUrl={repo} />`. On the project page, add the honest-accuracy note under it.

**Interfaces:**
- Consumes `loadModel`, `forward`, `topGuess`, `inkFromAlpha` and `preprocess` (Task 6), plus `/models/mnist/samples.json`.
- Produces `MnistCard` props: `{ codeUrl: string; fullDemoHref?: string }`. `fullDemoHref` defaults to `/projects/mnist-neural-network/#demo` and is hidden when the card is already on that page.

- [ ] **Step 1: Write the failing e2e tests** `tests/e2e/mnist-card.spec.ts`, run on chromium and `Pixel 7`.
  ```ts
  test('sample button shows the right guess', …)   // scroll to card; wait for "Loading model…" to go; click "Sample 7"; expect guess text /^7/ and a percentage
  test('drawing shows a guess', …)                 // mouse-drag a vertical line on the canvas; expect a guess between 0 and 9 to appear
  test('empty canvas', …)                          // click "Guess" with nothing drawn → "Draw a digit first"
  test('stroke leaving the canvas ends cleanly', …) // drag from inside to 50px past the right edge, release outside, draw again inside; no console errors; guess appears
  test('clear', …)                                 // after a guess, "Clear" → guess text removed, canvas alpha all 0 (evaluate getImageData)
  test('model fails to load', …)                   // page.route('**/models/mnist/weights.bin', r => r.abort()); expect "Demo couldn't load" and a link to the repo
  test('works after view-transition navigation', …) // home → click MNIST title → back → Sample 3 → guess /^3/
  test('touch drawing on phone', …)                // Pixel 7 project: use touchscreen-dispatched pointer events; guess appears
  ```
- [ ] **Step 2: Run them to confirm they fail.** Run `npx playwright test tests/e2e/mnist-card.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement `MnistCard`.**
  - **Layout:** a navy panel (`.on-dark`, 6px radius). A 280×280 CSS-pixel canvas sits on `--demo-surface`, scaled for `devicePixelRatio`, with `touch-action: none`. Strokes are `--amber-bright`, 18px wide, with round caps.
  - **Drawing:** strokes come from `pointerdown`, `pointermove` and `pointerup` with `setPointerCapture`. `pointercancel` and `lostpointercapture` end the stroke.
  - **When it guesses:** the card guesses on `pointerup`, and also from a "Guess" button for keyboard users. The guess reads alpha from a hidden 280×280 canvas drawn at 1× in black.
  - **Sample buttons:** ten buttons labelled `Sample 0` through `Sample 9`. Each paints its sample's pixels scaled up 10× and runs the guess.
  - **Guess display:** "7 · 94%" in mono `--amber-bright`, inside an `aria-live="polite"` region. Below it is a "Watch it think" link to `fullDemoHref`.
  - **Loading:** load the model once per page with a module-level promise. Show "Loading model…" while it loads. On failure, show "Demo couldn't load", plus a link to `codeUrl` labelled "View the code".
  - **Storage:** nothing is stored.
- [ ] **Step 4: Run the tests to confirm they pass.** Run `npx playwright test`. Expected: every spec passes, including the axe test from Task 5, now that the card is mounted.
- [ ] **Step 5: Commit.** `git commit -m "feat: MNIST card demo island"`

---

### Task 8: CI, deploy and launch-check scripts

**Files:**
- Create: `scripts/check-placeholders.mjs`, `tests/unit/check-placeholders.test.ts`, `lighthouserc.json`, `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`, `.vscode/extensions.json`
- Modify: `package.json` scripts (`check:placeholders`, `check:links`)

**Interfaces:**
- Produces `check-placeholders.mjs`, which exports `findPlaceholders(html: string): string[]`. It matches `/\[[A-Z][A-Z0-9_ ]{1,40}\]/g` in text outside `<script>` and `<style>` tags. The CLI walks `dist/**/*.html`, prints each `file: match`, and exits 1 if it finds any.

- [ ] **Step 1: Write the failing unit test.**
  - `findPlaceholders('<p>[EMAIL] and [YEAR]</p>')` returns `['[EMAIL]','[YEAR]']`.
  - `'<p>a[0] x</p>'` returns `[]`, and so does a `[A-Z]` regex inside a `<script>` tag.
  - `'<a>[Fig. 1]</a>'` returns `[]`.
- [ ] **Step 2: Run it to confirm it fails, then implement it, then run it to confirm it passes.** Run `npm test`.
- [ ] **Step 3: Write the config and workflows.**
  - `check:links`: `linkinator dist --recurse --server-root dist --retry --timeout 10000`. It checks both internal and external links, skips `mailto:`, and also skips `linkedin.com`, which blocks bots.
  - `lighthouserc.json`: `staticDistDir: ./dist`, URLs `/` and `/projects/mnist-neural-network/`, and assertions `categories:performance|accessibility|best-practices|seo` ≥ 0.95, each as an `error`.
  - `ci.yml`: runs on `pull_request`. It uses `actions/checkout@v7`, then `actions/setup-node@v7` with `node-version-file: .nvmrc` and `cache: npm`. Then it runs, in order: `npm ci`, `npm run check`, `npm run lint`, `npm run format:check`, `npm test`, `npm run build`, `npx playwright install --with-deps`, `npm run test:e2e`, `npm run check:links`, `npx lhci autorun`, `npm run check:placeholders`.
  - `deploy.yml`: runs on `push` to `main` and on `workflow_dispatch`, with `permissions: pages: write, id-token: write, contents: read` and concurrency group `pages`. The build job uses `withastro/action@v6` (node version from `.nvmrc`). The deploy job uses `actions/deploy-pages@v5`, with `environment: github-pages`.
  - `.vscode/extensions.json`: recommends the Astro, ESLint, Prettier and Vitest extensions.
- [ ] **Step 4: Verify locally.** Run `npm run build; npm run check:links; npx lhci autorun; npm run check:placeholders`. Expected: Lighthouse passes. Two checks are expected to fail until Don sends the missing values:
  - The link check reports only `/resume.pdf`.
  - The placeholder check lists only `[EMAIL]`, `[LINKEDIN_URL]` and `[RESUME_CONTENT]`.
- [ ] **Step 5: Commit, push and open the PR.** Run `git push -u origin astro-rebuild`, then `gh pr create`, with a body that lists the remaining placeholders and the manual launch checks from spec Section 6. Expected: every CI step is green except those two expected failures.

---

## Left for Don (not tasks)

- Switch GitHub Pages to deploy from **GitHub Actions** in the repo's settings, before merging.
- Send the email, LinkedIn URL, resume content and `resume.pdf`, and rewrite the drafted headline, intro and About text.
- Merge MNIST PR #1, so that `export-weights` lands on `master`. The site already has copies of the files.
- After merging the site: submit the sitemap to Google Search Console, and do the manual keyboard, screen reader and real-device checks from spec Section 6.
