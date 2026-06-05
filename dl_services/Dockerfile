# DL inference microservice for the Failure-to-Role Mapping platform.
# CPU-only torch keeps the image small enough for standard/free hosting tiers
# (Render, Railway, Fly.io). The Next.js backend calls /analyze server-side.
FROM python:3.11-slim

WORKDIR /app

RUN pip install --no-cache-dir --upgrade pip

# Install CPU-only torch first (the default wheel pulls huge CUDA deps), then
# the lightweight web stack.
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu \
 && pip install --no-cache-dir numpy fastapi "uvicorn[standard]" "pydantic>=2.0"

# App code + trained checkpoints (models/, checkpoints/, main.py).
COPY . /app

EXPOSE 8000
# Hosting platforms inject $PORT; fall back to 8000 for local `docker run`.
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
