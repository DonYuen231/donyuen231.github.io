#!/usr/bin/env python3
"""Build public/resume.pdf from the resume page, and check that the site stays in sync.

The resume page (src/pages/resume.astro) is the single source of truth. This script:
  1. pulls the resume HTML out of resume.astro (or reads a bare .html fragment),
  2. checks that the Experience and Education sections match src/pages/experience.astro,
  3. checks the wording rules (no banned words, no em dashes, no placeholders, no phone number),
  4. renders a single-column, text-only PDF that resume-screening software can read.

Usage (from the repo root):
  pip install reportlab
  python3 scripts/build-resume-pdf.py              # check, then build public/resume.pdf
  python3 scripts/build-resume-pdf.py --check-only # check only

Exit code 1 means a check failed and no PDF was written.
"""

import argparse
import html
import os
import re
import sys
from html.parser import HTMLParser

# ---------------------------------------------------------------------------
# Header details. The web page gets these from the site footer; the PDF needs
# them at the top. Never add a phone number or street address: the PDF is public.
# ---------------------------------------------------------------------------
NAME = "Don Yuen"
CITY = "Flushing, NY"
EMAIL = "donyuen231@gmail.com"
LINKEDIN = "https://www.linkedin.com/in/donyuen231"
GITHUB = "https://github.com/DonYuen231"
SITE = "https://donyuen231.github.io"

BANNED_WORDS = ["entry-level", "entry level", "junior"]


# ---------------------------------------------------------------------------
# Getting the fragment out of an .astro page
# ---------------------------------------------------------------------------
def extract_fragment(path):
    text = open(path, encoding="utf-8").read()
    if not path.endswith(".astro"):
        return text
    body = re.sub(r"^---.*?---\s*", "", text, count=1, flags=re.S)  # frontmatter
    body = re.sub(r"<style.*?</style>", "", body, flags=re.S)
    # Prettier writes {' '} to keep a space at a line break; Astro renders it as a space.
    body = re.sub(r"\{\s*(['\"]) \1\s*\}", " ", body)
    m = re.search(r"</h1>", body)
    if not m:
        sys.exit(f"{path}: no <h1> found, so the content start can't be located")
    body = body[m.end():]
    end = body.rfind("</BaseLayout>")
    if end != -1:
        body = body[:end]
        last_div = body.rfind("</div>")
        if last_div != -1:
            body = body[:last_div]
    # Page chrome that is not resume content.
    body = re.sub(r'<div class="download">.*?</div>', "", body, flags=re.S)
    body = re.sub(r'<p class="lede">.*?</p>', "", body, flags=re.S)
    return body.strip()


# ---------------------------------------------------------------------------
# Parsing the fragment into simple blocks
# ---------------------------------------------------------------------------
class Blocks(HTMLParser):
    """Turns the fragment into a list of (kind, inline_markup, plain_text)."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.blocks = []
        self.kind = None
        self.markup = []
        self.plain = []

    def handle_starttag(self, tag, attrs):
        if tag in ("h2", "h3", "p", "li"):
            self.kind, self.markup, self.plain = tag, [], []
        elif tag == "a" and self.kind:
            href = dict(attrs).get("href", "")
            if href.startswith("/"):
                href = SITE + href
            self.markup.append(f'<a href="{html.escape(href)}" color="#1a4d8f">')

    def handle_endtag(self, tag):
        if tag == "a" and self.kind:
            self.markup.append("</a>")
        elif tag == self.kind:
            plain = re.sub(r"\s+", " ", "".join(self.plain)).strip()
            markup = re.sub(r"\s+", " ", "".join(self.markup)).strip()
            if plain:
                self.blocks.append((tag, markup, plain))
            self.kind = None

    def handle_data(self, data):
        if self.kind:
            self.plain.append(data)
            self.markup.append(html.escape(data, quote=False))


def parse(fragment):
    p = Blocks()
    p.feed(fragment)
    return p.blocks


def section_text(blocks, names):
    """Plain text of the named h2 sections, in order, for comparison."""
    out, keep = [], False
    for kind, _, plain in blocks:
        if kind == "h2":
            keep = plain in names
        if keep:
            out.append(f"{kind}: {plain}")
    return out


# ---------------------------------------------------------------------------
# Checks
# ---------------------------------------------------------------------------
def run_checks(resume_frag, resume_blocks, experience_path):
    problems = []
    text = " ".join(b[2] for b in resume_blocks)
    lower = text.lower()
    for word in BANNED_WORDS:
        if word in lower:
            problems.append(f'banned word "{word}" found')
    if "\u2014" in resume_frag:
        problems.append("em dash found (Don's style: no em dashes)")
    for token in re.findall(r"\[[A-Z][A-Z0-9_ ]{1,40}\]", resume_frag):
        problems.append(f"placeholder {token} found")
    if re.search(r"\(?\d{3}\)?[ .-]\d{3}[ .-]\d{4}", text):
        problems.append("something that looks like a phone number was found")
    for kind, _, plain in resume_blocks:
        if kind == "h2" and plain not in (
            "Skills", "Projects", "Experience", "Education", "Certifications", "Awards"
        ):
            problems.append(f'unexpected section "{plain}" (update the script if this is intended)')

    if experience_path and os.path.exists(experience_path):
        exp_blocks = parse(extract_fragment(experience_path))
        a = section_text(resume_blocks, {"Experience", "Education"})
        b = section_text(exp_blocks, {"Experience", "Education"})
        if a != b:
            problems.append("Experience/Education on the resume page and the Experience page differ:")
            for i in range(max(len(a), len(b))):
                x = a[i] if i < len(a) else "(missing)"
                y = b[i] if i < len(b) else "(missing)"
                if x != y:
                    problems.append(f"    resume:     {x}\n    experience: {y}")
                    break
    elif experience_path:
        problems.append(f"{experience_path} not found, so the sync check was skipped")
    return problems


# ---------------------------------------------------------------------------
# PDF
# ---------------------------------------------------------------------------
def register_fonts():
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.lib.fonts import addMapping

    candidates = [
        ("/usr/share/fonts/truetype/crosextra/Carlito-Regular.ttf",
         "/usr/share/fonts/truetype/crosextra/Carlito-Bold.ttf",
         "/usr/share/fonts/truetype/crosextra/Carlito-Italic.ttf"),
        ("C:/Windows/Fonts/calibri.ttf", "C:/Windows/Fonts/calibrib.ttf", "C:/Windows/Fonts/calibrii.ttf"),
        ("/Library/Fonts/Arial.ttf", "/Library/Fonts/Arial Bold.ttf", "/Library/Fonts/Arial Italic.ttf"),
    ]
    for reg, bold, ital in candidates:
        if all(os.path.exists(f) for f in (reg, bold, ital)):
            pdfmetrics.registerFont(TTFont("Body", reg))
            pdfmetrics.registerFont(TTFont("Body-Bold", bold))
            pdfmetrics.registerFont(TTFont("Body-Italic", ital))
            addMapping("Body", 0, 0, "Body")
            addMapping("Body", 1, 0, "Body-Bold")
            addMapping("Body", 0, 1, "Body-Italic")
            addMapping("Body", 1, 1, "Body-Bold")
            return "Body", "Body-Bold", "Body-Italic", 9.6
    return "Helvetica", "Helvetica-Bold", "Helvetica-Oblique", 8.8


def build_pdf(blocks, out_path):
    from reportlab.lib.colors import HexColor
    from reportlab.lib.enums import TA_LEFT
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import HRFlowable, KeepTogether, Paragraph, SimpleDocTemplate, Spacer

    reg, bold, ital, size = register_fonts()
    ink, muted, rule = HexColor("#111111"), HexColor("#444444"), HexColor("#999999")

    def style(name, **kw):
        base = dict(fontName=reg, fontSize=size, leading=size * 1.17, textColor=ink, alignment=TA_LEFT)
        base.update(kw)
        return ParagraphStyle(name, **base)

    s_name = style("name", fontName=bold, fontSize=size * 2.0, leading=size * 2.3)
    s_contact = style("contact", textColor=muted, spaceAfter=4)
    s_h2 = style("h2", fontName=bold, fontSize=size * 1.1, leading=size * 1.3, spaceBefore=5, spaceAfter=0)
    s_h3 = style("h3", fontName=bold, spaceBefore=3)
    s_meta = style("meta", fontName=ital, textColor=muted, spaceAfter=1)
    s_p = style("p", spaceAfter=2)
    s_li = style("li", leftIndent=10, bulletIndent=1, spaceAfter=0.4, bulletFontName=reg)

    link = lambda url, text: f'<a href="{url}" color="#1a4d8f">{text}</a>'
    contact = " · ".join([
        CITY,
        link("mailto:" + EMAIL, EMAIL),
        link(LINKEDIN, LINKEDIN.replace("https://www.", "")),
        link(GITHUB, GITHUB.replace("https://", "")),
    ])

    story = [Paragraph(NAME, s_name), Paragraph(contact, s_contact)]
    pending_h3 = None
    prev = None
    for kind, markup, plain in blocks:
        if pending_h3 is not None and not (kind == "p" and prev == "h3"):
            story.extend(pending_h3)
            pending_h3 = None
        if kind == "h2":
            story.append(Paragraph(markup.upper(), s_h2))
            story.append(HRFlowable(width="100%", thickness=0.6, color=rule, spaceBefore=1, spaceAfter=2))
        elif kind == "h3":
            pending_h3 = [Paragraph(markup, s_h3)]
        elif kind == "p" and prev == "h3" and pending_h3 is not None:
            # The dates/location (or stack and links) line under a heading.
            pending_h3.append(Paragraph(markup, s_meta))
            story.append(KeepTogether(pending_h3))
            pending_h3 = None
        elif kind == "p":
            story.append(Paragraph(markup, s_p))
        elif kind == "li":
            story.append(Paragraph(markup, s_li, bulletText="•"))
        prev = kind
    if pending_h3:
        story.extend(pending_h3)

    doc = SimpleDocTemplate(
        out_path, pagesize=letter,
        leftMargin=0.55 * inch, rightMargin=0.55 * inch, topMargin=0.45 * inch, bottomMargin=0.45 * inch,
        title=f"{NAME} Resume", author=NAME, subject="Resume", creator="scripts/build-resume-pdf.py",
    )
    doc.build(story)
    return doc.page


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--source", default="src/pages/resume.astro", help="resume.astro or a bare .html fragment")
    ap.add_argument("--experience", default="src/pages/experience.astro",
                    help="experience.astro or .html fragment to compare against ('' to skip)")
    ap.add_argument("--out", default="public/resume.pdf")
    ap.add_argument("--check-only", action="store_true")
    args = ap.parse_args()

    fragment = extract_fragment(args.source)
    blocks = parse(fragment)
    problems = run_checks(fragment, blocks, args.experience)
    if problems:
        print("Resume checks failed:")
        for p in problems:
            print("  - " + p)
        sys.exit(1)
    print("Resume checks passed.")
    if args.check_only:
        return
    pages = build_pdf(blocks, args.out)
    print(f"Wrote {args.out} ({pages} page{'s' if pages != 1 else ''}).")
    if pages > 2:
        print("Warning: the PDF is over 2 pages. Trim bullets on the resume page.")
        sys.exit(1)


if __name__ == "__main__":
    main()
