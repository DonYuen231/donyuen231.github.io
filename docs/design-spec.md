# Portfolio Website Design Spec

**Owner:** Don Yuen
**Site:** https://donyuen231.github.io (repo `DonYuen231/donyuen231.github.io`)
**Status:** Design approved section by section on 2026-11-08. Ready for an implementation plan.
**Mockups:** [Portfolio concept directions canvas](https://claude.ai/artifact/AaRouiuokpBdk4qfyXogRe). The approved direction is the board titled "Option 4".

---

## 0. Purpose and audience

The site shows my projects to software engineering hiring managers and recruiters, with interactive demos they can try. It is for engineering roles in general, not only junior roles, so it should not say "entry-level" anywhere. The design and structure should hold up for years while projects are added and removed.

**What success looks like**

- A recruiter understands who I am and sees real work within a few seconds of landing.
- At least one demo is playable right on the home page.
- Adding a new project means adding one file, not editing layouts.
- The site is fast, accessible, and works well on phones.

**Projects at launch:** the MNIST neural network and the Historic Photo Explorer. The AI RPG engine is not on the site.

---

## 1. Site map and pages

| Page | URL | Contents |
|---|---|---|
| Home | `/` | Intro and background note, then "Selected work" with featured projects as full cards (with demos), then the contact footer. |
| All projects | `/projects/` | Every published project as a compact card (title, summary, tags, year), newest entry first. No demos. |
| Project page | `/projects/<slug>/` | Card header, interactive demo, Problem / Approach / Result, full write-up, "Next project" link. |
| About | `/about/` | Short bio and the kind of engineering I like doing. |
| Experience | `/experience/` | Work history and education. |
| Notes | `/notes/` and `/notes/<slug>/` | Blog posts. Built from day one but hidden from the menu until the first post is published. |
| Resume | `/resume/` | Resume as a web page, plus a download at `/resume.pdf`. |
| Privacy | `/privacy/` | Short privacy note (see Section 7). Linked from the footer. |
| Not found | `/404` | Friendly "page not found" in the site style, with links home and to projects. |
| Contact | Footer on every page | Email, GitHub, LinkedIn. "Contact" in the menu jumps to the footer. No separate page. |

**Menu (in order):** Work, About, Experience, Notes (hidden until the first post), Resume, Contact.

**Featured projects:** a project appears in "Selected work" on the home page only when its `featured` field is `true`.

### Opening a project

- The project **title** and an **"Open project"** link on each card go to the project page. The whole card is not one link, because the card demo must stay usable.
- Navigation uses Astro's `<ClientRouter />` (view transitions). The card header strip and title on the home page share a `transition:name` with the header on the project page, so the card appears to grow into the page.
- Real URLs are kept so links can be shared, the back button works, and search engines index each project.
- Browsers without view transition support load the page normally. Reduced motion is respected automatically.

### Project page layout (top to bottom)

1. Card header: entry number, tags, year, and title (the part that animates in from the card).
2. The interactive demo, full width.
3. Problem, Approach, and Result.
4. The write-up: Overview, How it works, Results (with numbered figures), What I'd change, Links.
5. A "Next project" link.

---

## 2. Visual system

The approved look is "Option 4": a notebook-style layout with projects in cards, a dark navy header and footer, amber accents, and dark demo panels.

### Colors (`src/styles/tokens.css`)

| Token | Value | Use |
|---|---|---|
| `--navy` | `#111827` | Header and footer background, demo panels, main text, solid buttons |
| `--paper` | `#FAFAF9` | Page background |
| `--grid-line` | `rgba(17, 24, 39, 0.045)` | Notebook grid lines, 24px squares, over `--paper` |
| `--card` | `#FFFFFF` | Card background |
| `--card-border` | `#D1D5DB` | Card border |
| `--divider` | `#E5E7EB` | Line under the card header strip |
| `--text` | `#111827` | Body text and headings |
| `--text-soft` | `#374151` | Secondary paragraphs (background note) |
| `--text-muted` | `#4B5563` | Labels, captions, tags, year |
| `--amber` | `#B45309` | Links, the background note's dashed border, focus ring on light backgrounds |
| `--amber-hover` | `#7C2D12` | Link hover |
| `--amber-bright` | `#FBBF24` | Accents on dark backgrounds: "Contact" in the menu, footer links, demo ink, predictions, focus ring on dark |
| `--on-dark` | `#F9FAFB` | Main text on navy |
| `--on-dark-soft` | `#E5E7EB` | Menu links on navy |
| `--on-dark-muted` | `#D1D5DB` | Small labels inside demo panels |
| `--demo-surface` | `#1F2937` | Drawing area inside the demo panel |
| `--demo-error` | `#60A5FA` | Backward pass (error) color, used only inside the MNIST demo |

Rules:

- Amber is for links and demo highlights only. Entry labels ("Entry 01") are navy, not amber, so they do not look clickable.
- No other accent colors on the page. The demo panel is where the bright color lives.
- All text and background pairs pass WCAG AA. Measured: amber on paper 4.8:1, amber on white 5.0:1, muted gray on white 7.6:1, bright amber on navy 10.6:1. `--demo-error` on navy is about 7:1.

### Fonts

- **IBM Plex Sans** (400, 600, 700) for headings and body text.
- **IBM Plex Mono** (400, 500, 700) for the logo, labels ("Problem", "Entry 01"), tags, captions, and demo text.
- Self-hosted with Fontsource and `font-display: swap`. No requests to Google Fonts.

| Element | Size |
|---|---|
| Name (h1) | `clamp(44px, 9vw, 72px)`, weight 700, line height 1.02 |
| Intro line | `clamp(21px, 3.4vw, 26px)`, line height 1.35 |
| Section heading (h2) | 28px, weight 600 |
| Project title (h3) | `clamp(26px, 4vw, 34px)`, weight 700 |
| Body | 17px, line height 1.5 |
| Labels, tags, captions | 13 to 14px mono |

### Layout

- Content width: max 1120px, centered, 32px side padding (20px at 640px wide and below).
- Cards: white, 1px `--card-border`, 10px corner radius, header strip with a `--divider` line under it.
- Demo panels: navy, 6px corner radius.
- Buttons: square corners. Solid (navy with white text) and outline (navy border). At least 48px tall.

### Responsive rules (from the design review)

- **Problem / Approach / Result:** each row is a flex row that wraps. The label is 110px wide; the text has a 260px minimum. On narrow cards, the label moves onto its own line above the text.
- **Menu on phones:** one row that scrolls sideways (scrollbar hidden). It never wraps onto two rows. The header has 8px top and bottom padding.
- **Tap targets:** every link and button is at least 44px tall, including menu, footer, and card links.
- **Demo order on phones:** at 640px and below, the demo appears above the text in each card.
- **Card links:** "Open project" and "View the code" sit at the bottom of the card's text column, so cards have no empty corner.

### Reusable components

`Header`, `Footer`, `ProjectCard` (full and compact variants), `BackgroundNote`, `Figure` (auto-numbered "Fig. N" with caption), `Button` (solid and outline).

### Motion and accessibility

- Light mode only at launch.
- Motion is minimal. All animation respects `prefers-reduced-motion`.
- Focus outline: 2px `--amber` with 2px offset; `--amber-bright` on navy areas.
- Headings stay in order: one h1 per page, then h2, then h3.
- Real `<a>` and `<button>` elements only. Icon-only buttons get an `aria-label`.

---

## 3. Content format

### Projects (`src/content/projects/<slug>.mdx`)

The file name is the URL slug. MDX is used so the demo and figures can sit inside the write-up.

Example frontmatter:

```yaml
---
title: "A neural network written from scratch"
entry: 1
year: 2026
summary: "MNIST digit classifier in NumPy with hand-derived backprop."
tags: ["python", "numpy"]
problem: "Classify handwritten digits without using an ML framework."
approach: "NumPy only. Backpropagation derived by hand and checked against numerical gradients."
result: "**98.32%** on the 10,000-image MNIST test set."
demo: "mnist"
featured: true
repo: "https://github.com/DonYuen231/mnist-neural-network"
draft: false
---
```

Schema (Zod in `src/content.config.ts`):

| Field | Type | Rule |
|---|---|---|
| `title` | string | Required |
| `entry` | integer | Required. Must be unique across projects (checked by a unit test that loads all project files). |
| `year` | integer | Required |
| `summary` | string | Required, 160 characters or fewer. Also used as the page's meta description. |
| `tags` | string array | Required, at least one |
| `problem`, `approach`, `result` | string | Required. Short Markdown allowed (bold, links). |
| `demo` | enum | One of `mnist`, `saved-runs`, `video`, `image`, `none`. Default `none`. |
| `image` | object | Optional. `{ src, alt }`. `alt` is required whenever `image` is present. |
| `featured` | boolean | Default `false` |
| `repo` | URL | Required |
| `live` | URL | Optional |
| `ogImage` | path | Optional social preview image for the project page |
| `draft` | boolean | Default `false`. Drafts are never built or published. |

Write-up body headings, in this order: **Overview**, **How it works**, **Results**, **What I'd change**, **Links**. Figures use `<Figure src alt caption />`, which numbers them automatically.

Sorting: home and `/projects/` list projects by `entry`, highest first.

### Notes (`src/content/notes/<slug>.mdx`)

| Field | Type | Rule |
|---|---|---|
| `title` | string | Required |
| `date` | date | Required |
| `summary` | string | Required, 160 characters or fewer |
| `project` | reference | Optional link to a project. The project page then links back to the post. |
| `draft` | boolean | Default `false` |

The menu shows "Notes" only when at least one non-draft note exists.

---

## 4. Demos

### 4.1 MNIST: "Watch it think"

The demo has two sizes that share the same model and preprocessing code.

- **Card version (home page):** drawing canvas, sample digit buttons, "clear" button, and the top guess. A "Watch it think" link opens the project page at the demo.
- **Full version (project page):** everything below.

#### Part 1: Draw and forward pass

1. **Draw.** The visitor draws a digit on a canvas (pointer events, so mouse, touch, and pen all work; `touch-action: none` on the canvas). Sample buttons load real MNIST test images for visitors who use a keyboard or do not want to draw.
2. **Shrink.** The drawing pixelates down to 28×28, showing the crop, scale to fit 20×20, and center-by-mass steps used by MNIST.
3. **Unroll.** The 28 rows peel off one at a time and stack into one tall strip of 784 cells (the input layer), scaled to fit the panel height.
4. **Forward.** Pulses travel from the strip to the 128 neurons, then to the 64, then to the 10 outputs. Each neuron's brightness is its activation divided by the largest activation in that layer, mapped to amber opacity from 0.12 to 1.
5. **Guess.** The output with the highest probability lights up. The demo asks "Is this a 7?" with **Yes** and **No** buttons.

**Connections:** drawing all ~100,000 input connections would be unreadable. For each layer step, only the strongest incoming connections (largest `|weight × input|`) into the most active neurons are drawn as thin lines. Starting values: the top 30% of neurons by activation, up to 8 incoming lines each. Both numbers are constants in `steps.ts` so they can be tuned.

#### Part 2: Wrong guess and backward pass

1. **No.** The visitor picks the digit they actually drew (buttons 0 to 9).
2. **Error.** The output layer shows the error: the wrong guess dims and the correct digit is marked as the target.
3. **Backward.** The error flows back from the outputs to the 64, then the 128 neurons, drawn in `--demo-error` so it looks different from forward pulses. The connections whose weights change the most flash briefly.
4. **Update.** One gradient descent step on this single example, using cross-entropy loss. The learning rate is `DEMO_LEARNING_RATE` in `steps.ts`, which starts at the `model.json` value (0.1). At 0.1, one step on a single image pushes the logits from about ±16 to about ±270, so the demo may use a smaller value. Training math is unchanged. Then a fast forward pass runs and the result is shown, for example "Your 3 went from 12% to 41%."
5. **Yes.** If the first guess was right, the demo says so and offers "Draw another."

#### Controls

- **Skip animation:** jumps to the next resting point (the question, or the final result). It is on by default when the visitor has reduced motion turned on.
- **Reset model:** restores the original weights.
- **Clear:** clears the canvas.
- **Step caption:** one line of text for each step (for example "Layer 2: 64 neurons, 23 active"). It sits in an `aria-live="polite"` region so screen readers follow along.

#### Rules

- **Learning stays local.** Weight updates change only the visitor's in-memory copy. Nothing is saved or shared. Reloading resets it. A short note under the demo says so.
- **Honest accuracy.** The page states that 98.32% is test-set accuracy and that hand-drawn digits are usually harder.
- **Same math as Python.** The TypeScript forward and backward pass must match the NumPy implementation (see fixtures below).
- **Smooth animation.** Drawn on `<canvas>` with `requestAnimationFrame`. Ease-in-out timing. Starting durations: shrink 600ms, unroll 900ms, each layer step 700ms. Durations are constants so they can be tuned.
- **State machine.** The steps run as an explicit state machine in `steps.ts`: `idle → drawing → ready → shrinking → unrolling → forward(1..3) → asking → (correct | choosingLabel → backward(3..1) → updating → reforward → result)`. Skip moves to the next resting state. "Clear" and "Reset model" return to `idle`.
- **Phones:** the network flows top to bottom, with each layer as a row, so nothing scrolls sideways.
- **Loading:** the React island uses `client:visible`, so model files download only when the demo scrolls into view. While loading it shows "Loading model…". If loading fails, it shows "Demo couldn't load" with a link to the code.

#### Model files and the export script

Changes in the `mnist-neural-network` repo:

- Add saving of the trained parameters after final training (the README does not mention saved weights today).
- Add `export_weights.py`, which writes:
  - `weights.bin`: all weights and biases as little-endian float32, in the order listed in `model.json`. About 109,000 numbers (about 430 KB).
  - `model.json`: `version`, `layers` (`[784, 128, 64, 10]`), `activation` (`relu`), `output` (`softmax`), `learningRate` (`0.1`), `testAccuracy` (`0.9832`), `normalization` (whatever `data.py` does), and `order` (`["W1", "b1", "W2", "b2", "W3", "b3"]` with shapes).
  - `fixtures.json`: 20 MNIST test images with the probabilities Python gives for each, plus one example image and label with a sample of 200 gradient values (index and value) from Python's backward pass.
- Copy the three files into the site at `public/models/mnist/`. The `version` field shows which model the site is using.

### 4.2 Historic Photo Explorer: "Follow the request"

**Goal:** show that I can build a server that calls two APIs in order and keeps the API key on the server. The demo replays a saved run as an animated call diagram, then shows the real results. It is always labeled **"Saved run, not live"**.

Source repo: `DonYuen231/historic-photo-explorer` (`main`). Saved runs come from `eval/results-v2.json`, which holds 20 photos from 4 searches.

#### Card version (home page)

- Four buttons, one for each saved search: "portrait · New York", "sign · New York", "crowd · Chicago", "bird's eye view · Pennsylvania".
- A compact version of the call diagram plays after a search is picked.
- Below it: the first photo with its description.
- A "Follow the request" link opens the project page at the demo.

#### Full version (project page)

**1. Call diagram.** Four lanes: **Browser**, **Node server**, **Library of Congress API**, and **Claude API**. Arrows animate one at a time, in the same order as the app's code:

1. Browser → server: `GET /search?subject=sign&location=New York`. This request carries no key.
2. Server: checks its cache. It's a miss, so the server carries on.
3. Server → LoC: `GET https://www.loc.gov/photos/?q=…&fa=location:…&fo=json`. The API is public, so no auth is needed.
4. LoC → server: JSON search results. The server keeps the first 5 that have an image.
5. Server ↔ LoC: 5 image downloads, one at a time. Any image whose longest side is under 400px is marked "low resolution".
6. Server → Claude: `POST https://api.anthropic.com/v1/messages` with these headers:
   - `x-api-key: sk-ant-••••••••`, labeled "read from `ANTHROPIC_API_KEY` in the server's `.env`"
   - `anthropic-version: 2026-10-21`

   The body is summarized as the model, 5 base64 images with their catalog labels, and a JSON schema for structured output.
7. Claude → server: JSON that matches the schema, with one entry per photo.
8. Server → browser: an HTML results page that the server built itself, with every value escaped.

**2. The key stays on the server.** A key icon sits in the Node server lane for the whole replay. It travels only on arrow 6 (server to Claude, over HTTPS). A callout reads: "The API key never reaches the browser." The browser lane's request and response show no key.

**3. Inspector.** Selecting an arrow, or stepping to it, shows that call's method, URL, headers, and a shortened body or response. The key is always masked. Request details are rebuilt from the app's code using the saved subject and location; they are not recorded traffic. The page says so.

**4. Results.** After arrow 8, the 5 photos appear. Each one shows:
- The image, the catalog title, and the date.
- Claude's description, the estimated period, and the notable details.
- A "Low resolution" notice when the photo is flagged.
- A link to the LoC record and the rights advisory.

The results are labeled "Descriptions written by Claude, an AI model".

**Controls:**
- **Play** and **Step** (step through one arrow at a time).
- **Skip animation**, which follows the same rules as MNIST: it's on by default with reduced motion.
- **Replay**.

A step caption sits in an `aria-live="polite"` region, for example "Server → Claude API: 5 images, key sent in the x-api-key header".

**Phones:** the four lanes keep short names (You, Server, LoC, Claude) and fit at 320px. Arrow labels move into the caption and the inspector.

**Timing:** the saved runs have no real timings, so arrow durations are animation constants. The page makes no claims about speed.

**Build:** an Astro component with a small TypeScript module and an SVG diagram. No React. It uses the same `client:visible` style loading and the same "couldn't load" fallback as MNIST.

**Live mode (later):** when `PUBLIC_API_URL` is set (see Section 8), the same diagram can replay a real request. Saved runs stay the fallback.

#### Data preparation (`scripts/prepare-photo-runs.mjs`, run once and its output committed)

- Reads `results-v2.json` from the photo explorer repo.
- Downloads each image into `src/assets/photo-explorer/`, so Astro can optimize them. The site keeps its own copies for now.
- Gets each item's `rights_advisory` from `https://www.loc.gov/item/<id>/?fo=json`. Any photo whose advisory does not say "No known restrictions" is left out and listed in the script's output.
- Writes `src/data/photo-runs.json` with the search, the rebuilt request details, and the photo results.

No screen recording at launch; the call diagram replaces it.

---

## 5. Tech stack and workflow

### Stack

| Tool | What it does |
|---|---|
| Node.js (current LTS) and npm | Runs the tools; `npm run dev` previews locally and `npm run build` builds the site. |
| Astro | Builds the pages from components, layouts, and content. |
| TypeScript (strict) | Catches type mistakes before the site breaks. |
| React (via `@astrojs/react`) | Only for the MNIST demo island. |
| MDX (via `@astrojs/mdx`) | Project and note write-ups that can include components. |
| `@astrojs/sitemap` | Generates the sitemap for search engines. |
| Content collections with Zod | Check every project and note file's fields at build time. |
| Astro `<ClientRouter />` | View transitions between pages. |
| Plain CSS with CSS variables | Styling. Tokens live in `tokens.css`; components use Astro scoped styles. |
| Fontsource | Self-hosted IBM Plex fonts. |
| HTML canvas and `requestAnimationFrame` | Drawing and the network animation. |
| ESLint and Prettier | Lint and format code. |
| `astro check` | Type checks across the whole site. |
| Vitest | Unit tests. |
| Playwright with axe | Browser tests and accessibility scans. |
| GitHub Actions | CI on every pull request and deployment on merge. |
| GitHub Pages | Hosting. |

### Folder layout

```
src/
  components/          Header, Footer, ProjectCard, BackgroundNote, Figure, Button
  components/mnist/    MnistCard.tsx, MnistVisualizer.tsx,
                       model.ts (forward + backward), preprocess.ts,
                       steps.ts (state machine and animation constants)
  components/photo-explorer/  CallDiagram.astro, replay.ts (steps and timing constants)
  assets/photo-explorer/      saved-run images (own copies)
  data/                photo-runs.json (from scripts/prepare-photo-runs.mjs)
  content/projects/    one .mdx file per project
  content/notes/       one .mdx file per note
  content.config.ts    schemas from Section 3
  layouts/             BaseLayout.astro, ProjectLayout.astro
  pages/               index, about, experience, resume, privacy, 404,
                       projects/index + [slug], notes/index + [slug]
  styles/              tokens.css, global.css
public/
  models/mnist/        weights.bin, model.json, fixtures.json
  resume.pdf, favicon.svg, og-default.png, robots.txt
tests/
  unit/                Vitest
  e2e/                 Playwright
.github/workflows/     ci.yml, deploy.yml
docs/                  design-spec.md (this file)
LICENSE
```

### Repo setup

1. Tag the old site before replacing it: `git tag old-site-2020` and push the tag.
2. Clear the old files and start the Astro project in the same repo.
3. In the repo's Settings, under Pages, set the source to **GitHub Actions**.
4. `astro.config.mjs` sets `site: "https://donyuen231.github.io"`. No `base` is needed because the repo is named `donyuen231.github.io`.
5. Optional: archive or delete the private `DonYuen231-github.io` repo. It is an unused duplicate.

### Day-to-day workflow

- Each change goes on its own branch and is merged into `main` through a pull request.
- `ci.yml` runs on every pull request: `npm ci`, `astro check`, ESLint, `prettier --check`, Vitest, `astro build`, Playwright (including axe), a link check on the built site, Lighthouse CI, and a placeholder scan (fails if the built site contains bracketed placeholders like `[YEAR]`).
- `deploy.yml` runs on every push to `main`: builds with the official Astro GitHub Action and deploys with `actions/deploy-pages`.
- VS Code extensions: Astro, ESLint, Prettier, Vitest.

### Unit tests (minimum)

- Forward pass matches `fixtures.json` probabilities within `1e-5`.
- Backward pass matches the sampled Python gradients within `1e-5`.
- Preprocessing produces 28×28 output with the expected crop, scale, centering, and normalization.
- The state machine moves through its steps in order, and Skip, Clear, and Reset land in the right states.
- No two projects share an `entry` number.

### Rules

- `PUBLIC_API_URL` exists from the start and stays empty until an AWS backend exists.
- No API keys or secrets in the site code. Anything shipped to the browser is public.
- No embeds that set tracking cookies (regular YouTube players, social widgets). Plain links are fine.

---

## 6. Launch checks

All of these must pass before the new site replaces the old one.

**Page basics**
- [ ] Every page has its own `<title>` and meta description.
- [ ] Default social preview image (1200×630, site style) and optional per-project images.
- [ ] Favicon, 404 page, sitemap, and `robots.txt`.

**Content**
- [ ] No placeholders left (enforced by the CI scan).
- [ ] Headline and About text rewritten in my own words.
- [ ] `resume.pdf` is current and matches `/resume/`.
- [ ] All links work (enforced by the CI link check).
- [ ] Footer shows "© 2026 Don Yuen" and links to `/privacy/`.

**Quality**
- [ ] Lighthouse 95 or higher for Performance, Accessibility, Best Practices, and SEO on `/` and the MNIST project page (enforced by Lighthouse CI).
- [ ] Zero axe errors (enforced in Playwright).
- [ ] Manual keyboard-only pass through every page.
- [ ] Manual screen reader pass on the MNIST page (VoiceOver or NVDA).
- [ ] Tested on a real iPhone (Safari) and Android phone (Chrome), plus desktop Chrome, Firefox, and Safari. Drawing with a finger works.
- [ ] With reduced motion turned on, the demo skips its animation.

**MNIST demo**
- [ ] Fixture tests pass for the forward and backward pass.
- [ ] Playwright runs the full flow: pick a sample, see the guess, press No, pick a digit, and confirm that digit's probability goes up.
- [ ] The "Demo couldn't load" message shows when model files are missing.

**After launch**
- [ ] Submit the sitemap in Google Search Console.
- [ ] Optional: add GoatCounter analytics and mention it on the privacy page.

---

## 7. Privacy, licenses, and credits

**Cookies:** none. No cookie banner is needed as long as these stay true:
- Fonts are self-hosted.
- The MNIST demo stores nothing on the visitor's device.
- No tracking embeds (see Section 5 rules).
- If a setting is ever remembered (for example "always skip animation"), it is saved only after the visitor turns it on.
- GoatCounter, if added, is cookieless.

**Privacy page (`/privacy/`)** says:
- The site sets no cookies and does not collect personal data itself.
- It is hosted on GitHub Pages, and GitHub logs visitor IP addresses for security. Link to GitHub's privacy statement.
- If GoatCounter is added: what it counts (page views, referrers, screen size) and a link to its privacy policy.

**Licenses:**
- `LICENSE` in the repo: MIT for the code. Written content (write-ups, notes, About text) is all rights reserved, stated in the LICENSE file and on the privacy page.
- IBM Plex uses the SIL Open Font License. No on-page credit needed.

**Credits:**
- MNIST project page credits the dataset to Yann LeCun, Corinna Cortes, and Christopher J.C. Burges, with a link.
- Photo explorer credits as described in Section 4.2.

This section is general information, not legal advice.

---

## 8. Later list

- **AWS backend (option 1).** The site stays on GitHub Pages. Complex features, such as a live Historic Photo Explorer, run as separate AWS backends (for example Lambda) in their own repos. The site calls them through `PUBLIC_API_URL`. Each backend only accepts requests from the site's domain, has rate limits, and has an AWS budget alert. API keys live only in the backend.
- **Tailwind CSS.** Possible later. The design tokens would move into Tailwind's theme.
- **Historic Photo Explorer live mode.** Run the same call diagram against a real backend.
- **Dark mode.**
- **Contact form** (needs an outside form service on GitHub Pages).
- **Custom domain** (for example `donyuen.dev`).
- **GoatCounter analytics** (if not added at launch).

---

## 9. Open items for Don

These need my input before or during the build. None of them change the design.

1. ~~Real `year` values.~~ Done: both projects are 2026 (the photo explorer's year is for the rework).
2. ~~Photo explorer result.~~ Done: "A stricter prompt and thumbnail detection raised description accuracy from 4.45 to 4.90 out of 5 on a 20-photo rubric." It launches with `demo: "saved-runs"` (Section 4.2).
3. Final headline, intro line, and About text in my own words.
4. ~~Normalization.~~ Done (export PR #1): `x / 255.0`, range [0, 1], 28×28 flattened row by row, 0 = background, 1 = ink. MNIST is white ink on black, so `preprocess.ts` must invert the canvas's dark strokes on a light background.
5. ~~Sample images.~~ Done: `fixtures.json` includes 10 `samples`, one per digit.
6. A current `resume.pdf`.
