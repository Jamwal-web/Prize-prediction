# Multi-stage Dockerfile for PricePredictor AI with C++ Compilation
FROM python:3.10-slim AS builder

# Install C++ compiler tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    g++ \
    make \
    cmake \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy C++ source and compile native DSA forecast engine
COPY backend/cpp_engine /app/backend/cpp_engine
WORKDIR /app/backend/cpp_engine
RUN make

# Runtime stage
FROM python:3.10-slim

WORKDIR /app

# Install runtime dependencies
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend and data
COPY backend /app/backend
COPY data /app/data

# Copy compiled C++ binary from builder stage
COPY --from=builder /app/backend/cpp_engine/forecast_engine /app/backend/cpp_engine/forecast_engine
RUN chmod +x /app/backend/cpp_engine/forecast_engine || true

ENV PORT=5000
EXPOSE 5000

CMD ["gunicorn", "backend.wsgi:app", "--bind", "0.0.0.0:5000", "--workers", "2", "--threads", "4"]
