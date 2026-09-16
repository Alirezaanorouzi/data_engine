from __future__ import annotations

import os

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from parsers import OCR_ENABLED, OCR_MODEL, PARSER_VERSION, parse_pdf_bytes

app = FastAPI(title="PDF Parse Worker (PyMuPDF + Qwen OCR)", version="2.1.0")


@app.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "parser": PARSER_VERSION,
        "ocr": "qwen" if OCR_ENABLED else "disabled",
        "ocr_model": OCR_MODEL,
    }


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
