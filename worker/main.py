from __future__ import annotations

import os
from typing import Any

import fitz
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse

app = FastAPI(title="PDF Parse Worker (PyMuPDF)", version="1.0.0")


def _blocks_from_page(page: fitz.Page) -> list[dict[str, Any]]:
    blocks: list[dict[str, Any]] = []
    data = page.get_text("dict")

    for block in data.get("blocks", []):
        if block.get("type") != 0:
            continue
        lines: list[str] = []
        max_size = 0.0
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                text = (span.get("text") or "").strip()
                if text:
                    lines.append(text)
                    max_size = max(max_size, float(span.get("size") or 0))
        text = " ".join(lines).strip()
        if not text:
            continue
        btype = "heading" if max_size >= 14 else "paragraph"
        blocks.append(
            {
                "type": btype,
                "text": text,
                "bbox": block.get("bbox"),
            }
        )

    if blocks:
        return blocks

    text = page.get_text("text").strip()
    if not text:
        return []
    return [
        {"type": "paragraph", "text": part.strip(), "bbox": None}
        for part in text.split("\n\n")
        if part.strip()
    ]


def parse_pdf_bytes(data: bytes, filename: str = "document.pdf") -> dict[str, Any]:
    del filename
    doc = fitz.open(stream=data, filetype="pdf")
    pages: list[dict[str, Any]] = []
    markdown_parts: list[str] = []

    try:
        for idx in range(doc.page_count):
            page = doc[idx]
            page_number = idx + 1
            blocks = _blocks_from_page(page)
            pages.append({"page_number": page_number, "blocks": blocks})
            page_text = page.get_text("text").strip()
            if page_text:
                markdown_parts.append(f"## Page {page_number}\n\n{page_text}")
    finally:
        doc.close()

    markdown = "\n\n".join(markdown_parts)
    sample = markdown[:2000]
    language = "fa" if any("\u0600" <= ch <= "\u06FF" for ch in sample) else None

    return {
        "markdown": markdown,
        "pages": pages,
        "tables": [],
        "page_count": len(pages),
        "language": language,
        "parser_version": "pymupdf-v1",
    }


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "parser": "pymupdf-v1"}


@app.post("/parse")
async def parse(file: UploadFile = File(...)) -> JSONResponse:
    if not file.filename:
        raise HTTPException(status_code=400, detail="filename required")
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="empty file")
    try:
        payload = parse_pdf_bytes(data, file.filename)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"parse failed: {exc}") from exc
    return JSONResponse(payload)


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", "8090"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
