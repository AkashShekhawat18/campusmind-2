# =============================================================================
# CampusMind Python Backend — Multi-Stage Dockerfile
# Optimized for Python ML workloads
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1: Builder — Install dependencies with caching
# ---------------------------------------------------------------------------
FROM python:3.11-slim AS builder

# System dependencies required by pytesseract, PyMuPDF, Pillow
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-eng \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build

# Copy requirements first for layer caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt


# ---------------------------------------------------------------------------
# Stage 2: Runtime — Lean production image
# ---------------------------------------------------------------------------
FROM python:3.11-slim AS runtime

# Install runtime system dependencies (no gcc/build tools)
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-eng \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    && rm -rf /var/lib/apt/lists/*

# Copy installed Python packages from builder
COPY --from=builder /install /usr/local

# Create non-root user for security
RUN groupadd -r campusmind && useradd -r -g campusmind -d /app -s /sbin/nologin campusmind

WORKDIR /app

# Copy application code
COPY . .

# Create upload directory
RUN mkdir -p /app/uploads && chown -R campusmind:campusmind /app

# Switch to non-root user
USER campusmind

# Expose FastAPI port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

# Default command: run FastAPI with uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
