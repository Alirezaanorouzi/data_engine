from __future__ import annotations

import base64
import os
from typing import Any

import fitz
import httpx

PARSER_VERSION = "pymupdf+qwen-v1"
MIN_TEXT_CHARS = int(os.environ.get("OCR_MIN_TEXT_CHARS", "30"))
OCR_RENDER_SCALE = float(os.environ.get("OCR_RENDER_SCALE", "2.0"))
OCR_ENABLED = os.environ.get("OCR_ENABLED", "true").strip().lower() in {
    "1",
    "true",
    "yes",
}
OCR_MODEL = os.environ.get("OCR_MODEL", "qwen/qwen3.7-flash").strip()
OCR_PROMPT = os.environ.get(
    "OCR_PROMPT",
    "Extract all visible text from this document page in reading order. "
    "Return plain text only with no commentary.",
)


def _api_base_url() -> str:
    return (os.environ.get("OPENAI_BASE_URL") or "https://api.openai.com/v1").rstrip("/")


def _api_key() -> str | None:
    key = (os.environ.get("OPENAI_API_KEY") or "").strip()
    return key or None


def _detect_language(text: str) -> str | None:
    sample = text[:2000]
    return "fa" if any("\u0600" <= ch <= "\u06FF" for ch in sample) else None


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
                "source": "text",
            }
        )

    if blocks:
        return blocks

    text = page.get_text("text").strip()
    if not text:
        return []
    return [
        {
            "type": "paragraph",
            "text": part.strip(),
            "bbox": None,
            "source": "text",
        }
        for part in text.split("\n\n")
        if part.strip()
    ]


def _page_text(page: fitz.Page) -> str:
    return page.get_text("text").strip()


def _needs_ocr(page: fitz.Page, blocks: list[dict[str, Any]]) -> bool:
    if len(_page_text(page)) >= MIN_TEXT_CHARS:
        return False
    block_text = " ".join(b.get("text", "") for b in blocks).strip()
    return len(block_text) < MIN_TEXT_CHARS


def _page_png(page: fitz.Page) -> bytes:
    pix = page.get_pixmap(matrix=fitz.Matrix(OCR_RENDER_SCALE, OCR_RENDER_SCALE), alpha=False)
    return pix.tobytes("png")


def _ocr_with_qwen(png_bytes: bytes) -> str:
    api_key = _api_key()
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not set for OCR")

    b64 = base64.b64encode(png_bytes).decode("ascii")
    payload = {
        "model": OCR_MODEL,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": OCR_PROMPT},
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/png;base64,{b64}"},
                    },
                ],
            }
        ],
        "max_tokens": int(os.environ.get("OCR_MAX_TOKENS", "4096")),
        "temperature": 0,
    }

    timeout = float(os.environ.get("OCR_TIMEOUT_SEC", "120"))
    with httpx.Client(timeout=timeout) as client:
        res = client.post(
            f"{_api_base_url()}/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
        )
        res.raise_for_status()
        data = res.json()

    content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
    if isinstance(content, list):
        parts = []
        for part in content:
            if isinstance(part, dict) and part.get("type") == "text":
                parts.append(str(part.get("text", "")))
        content = "\n".join(parts)
    return str(content).strip()


def parse_pdf_bytes(data: bytes, filename: str = "document.pdf") -> dict[str, Any]:
    del filename
    doc = fitz.open(stream=data, filetype="pdf")
    pages: list[dict[str, Any]] = []
    markdown_parts: list[str] = []
    ocr_pages: list[int] = []

    try:
        for idx in range(doc.page_count):
            page = doc[idx]
            page_number = idx + 1
            blocks = _blocks_from_page(page)
            used_ocr = False

            if OCR_ENABLED and _needs_ocr(page, blocks):
                try:
                    ocr_text = _ocr_with_qwen(_page_png(page))
                    if ocr_text:
                        blocks = [
                            {
                                "type": "paragraph",
                                "text": ocr_text,
                                "bbox": None,
                                "source": "ocr",
                            }
                        ]
                        used_ocr = True
                        ocr_pages.append(page_number)
                except Exception:
                    pass

            pages.append(
                {
                    "page_number": page_number,
                    "blocks": blocks,
                    "ocr": used_ocr,
                }
            )

            page_md = "\n\n".join(b["text"] for b in blocks if b.get("text"))
            if not page_md:
                page_md = _page_text(page)
            if page_md:
                markdown_parts.append(f"## Page {page_number}\n\n{page_md}")
    finally:
        doc.close()

    markdown = "\n\n".join(markdown_parts)
    return {
        "markdown": markdown,
        "pages": pages,
        "tables": [],
        "page_count": len(pages),
        "language": _detect_language(markdown),
        "parser_version": PARSER_VERSION,
        "ocr_pages": ocr_pages,
        "ocr_model": OCR_MODEL if ocr_pages else None,
    }
