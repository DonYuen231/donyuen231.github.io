# Keeping the resume in sync

Read this before you change anything about Don's work history, education, skills, certifications, or projects on this site. The same facts live in several places. If you change one, change all of them in the same session.

Last updated: Nov 9, 2026 (first version of the Experience page, Resume page, and `resume.pdf`; project dates added).

**Paste content only over the content, never over the whole file.** Each page keeps its frontmatter, `BaseLayout`, `<h1>`, and styles, and the resume page keeps its "Download PDF" button. On Nov 9 the whole files were replaced by the fragments by mistake, which removed all of that. If a page has no `<h1>`, the build script stops and says so.

## Where the facts live

| What | Where | How it's kept in sync |
| --- | --- | --- |
| Resume page (the source of truth for this repo) | `src/pages/resume.astro`, the HTML under the "Download PDF" button | Edit this first. |
| Experience page | `src/pages/experience.astro`, the HTML under the lede | Must be a copy of the resume page's Experience and Education sections, word for word. The build script fails if they differ. |
| Resume PDF | `public/resume.pdf` | Built from the resume page by `scripts/build-resume-pdf.py`. Never edit the PDF by hand. |
| Project pages | `src/content/projects/*.mdx` | The `result` field and the numbers in the write-up must match the resume's project bullets. |
| GitHub READMEs | `github.com/DonYuen231/<repo>` | The project's numbers come from here. If a README changes a number, update the resume and the project page. |
| Outside this repo | Don's master resume and Candidate Profile in his Claude "Job Search HQ" project, and his LinkedIn | You probably can't reach these from a coding session. When the site changes, tell Don which of them also need the change. |

## How to rebuild and check

From the repo root:

```
pip install reportlab
python3 scripts/build-resume-pdf.py --check-only   # checks only
python3 scripts/build-resume-pdf.py                # checks, then writes public/resume.pdf
```

The script fails if:

- the Experience or Education sections on the two pages differ,
- it finds "entry-level", "entry level", or "junior",
- it finds an em dash, a `[PLACEHOLDER]` token, or something that looks like a phone number,
- it finds a section other than Skills, Projects, Experience, Education, Certifications, or Awards (edit the script's list if Don adds one on purpose),
- the PDF runs past 2 pages. Aim for 1 page. Trim bullets on the resume page if it spills over, then rebuild.

After building, open the PDF and look at it. Then run the site's own checks (`npm run build`, then the placeholder check and the tests).

## What to update when something changes

### Don adds a new project

1. Add the project's `.mdx` file as usual.
2. Ask Don if it should go on the resume. The resume shows his strongest 2 projects, or 3 if all of them fit on one page. If it replaces one, ask which.
3. Add it under `<h2>Projects</h2>` on the resume page: an `<h3>` with the name, then a `<p>` with the month and year (for example "Sep 2026 – Nov 2026", from the repo's first and latest commits unless Don gives other dates), the stack, a link to `/projects/<slug>/`, and a link to the full GitHub URL, then 2 to 4 bullets.
4. Take every number from the repo's README or the `.mdx`. Never round up or add a number that isn't there.
5. Add any new skills the project proves to the Skills list.
6. Rebuild the PDF.

### A project's results change (new accuracy, a part two, a new evaluation)

1. Update the README numbers first, or confirm Don already did.
2. Update the project's `.mdx` (`result` and the write-up).
3. Update the matching resume bullets.
4. Rebuild the PDF.

### Don starts a new job, a job ends, or a title changes

1. Ask Don for the exact title, company, city, and start and end month. Never guess a date.
2. Edit the resume page's Experience section, newest job first. Use "Mon YYYY – Present" for a current job. The date line looks like `<p>May 2024 – May 2025 · Queens, NY</p>`.
3. Copy the whole Experience and Education sections to the Experience page.
4. Rebuild the PDF.

### Education or certifications change

Same as a job: resume page first, copy Experience and Education to the Experience page, rebuild. Certifications only appear on the resume page and the PDF.

### Skills change

Edit only the resume page's Skills list, then rebuild. A skill goes on the list only if a job, a project, or Don himself backs it.

### Contact details change

The PDF header is set at the top of `scripts/build-resume-pdf.py` (name, city, email, LinkedIn, GitHub). The web page gets these from the site footer. Change both.

## Rules for the content

### Honesty

- Use only facts Don gave, or facts from his READMEs and project pages. Never invent employers, dates, titles, numbers, or skills. If something is missing, ask Don.
- MNIST: always say he worked with an AI coding assistant. Never say he built it alone. Don't oversell it, because MNIST is a standard benchmark.
- 98.32% is test-set accuracy. Say so.
- Photo explorer: 4.45 to 4.90 is the accuracy score only. Completeness didn't improve, so don't call it "description quality."
- No GPA.
- No class codes such as "CS 355". Use the course name or "a CS class".
- No phone number and no street address. The page and PDF are public.
- Keep these off until Don says they're done or have results: the Active Directory home lab (describe it as a home lab when it does go on, never as job experience), the job scraper, the monday.com board, and the `mnist-pytorch-cnn` repo.
- Never mention Diode or the SMT contract unless Don says he started it.

### Wording

- Audience: hiring managers and recruiters for software engineering roles, leaning toward AI engineering.
- Never use "entry-level" or "junior".
- The summary is in first person. Bullets start with a strong past-tense verb (present tense for a current job) and show impact, with a number when one is true.
- Plain words, varied sentence lengths, and Oxford commas.
- No em dashes. En dashes are only for date ranges.
- No "X rather than Y" constructions. No lists of three just for rhythm.

### HTML

- Plain semantic HTML only: `<h2>`, `<h3>`, `<p>`, `<ul>`, `<li>`, and `<a href>`. No classes, inline styles, scripts, or Markdown.
- `<h3>` is "Title, Company" for jobs, "Degree, School" for education, and the project name for projects.
- The `<p>` right under each job or school `<h3>` holds "Mon YYYY – Mon YYYY · City, ST". For projects, it holds the dates, the stack, and the links.
- Current project dates: Historic Photo Explorer is "Nov 2026" (the repo's dates; it began earlier as a class project, so change it if Don gives that semester). MNIST is "Sep 2026 – Nov 2026" (first and latest commits).
- Site links are relative (`/projects/<slug>/`). External links are full `https://` URLs.
- No square-bracket placeholders anywhere. Write "784-128-64-10", not a bracketed list.

## Current section order on the resume page

Summary paragraph (no heading), Skills, Projects, Experience, Education, Certifications. Projects come before Experience because the resume leans toward AI engineering. The Experience page has Experience, then Education.
