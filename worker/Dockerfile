FROM python:3.11-slim-bookworm

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY parsers.py main.py /app/

ENV PORT=8090
ENV OCR_ENABLED=true
ENV OCR_MODEL=qwen/qwen3.7-flash
ENV OCR_MIN_TEXT_CHARS=30
EXPOSE 8090

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8090"]
