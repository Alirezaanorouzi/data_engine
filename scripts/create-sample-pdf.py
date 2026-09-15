"""Generate a small sample PDF for pipeline testing (English + Persian mix)."""
from __future__ import annotations

from pathlib import Path

import fitz

OUT = Path(__file__).resolve().parent.parent / "storage" / "test-sample.pdf"

SECTIONS = [
    (
        "Chapter 1: Sample Contract",
        [
            "This document tests the data engine PDF parse and RAG pipeline.",
            "Party A: Alpha Company — Party B: Beta Organization",
            "Subject: Legal and commercial advisory services.",
        ],
    ),
    (
        "Chapter 2: Termination Conditions",
        [
            "Article 1: Either party may terminate with thirty days written notice.",
            "Article 2: Material breach allows immediate termination without notice.",
            "Article 3: Termination does not waive claims for damages.",
            "Reference: Civil Code Article 190 on essential validity conditions.",
            "Persian note: شرایط فسخ قرارداد و اخطار کتبی",
        ],
    ),
    (
        "Chapter 3: Dispute Resolution",
        [
            "Disputes shall first be resolved through good-faith negotiation.",
            "If unresolved, binding arbitration in Tehran applies.",
        ],
    ),
]


def main() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    doc = fitz.open()
    for title, paragraphs in SECTIONS:
        page = doc.new_page(width=595, height=842)
        y = 72
        page.insert_text((72, y), title, fontsize=14)
        y += 32
        for para in paragraphs:
            page.insert_text((72, y), para, fontsize=11)
            y += 22
    doc.save(OUT)
    doc.close()
    print(f"Wrote {OUT} ({OUT.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
