# Flask app Dockerfile
FROM python:3.11-alpine

# Install needed system dependencies (INCLUDING WEBP SUPPORT)
RUN apk update && apk add --no-cache \
    gcc \
    musl-dev \
    libffi-dev \
    libwebp-dev \
    zlib-dev \
    jpeg-dev \
    freetype-dev \
    lcms2-dev \
    openjpeg-dev \
    tiff-dev \
    tk-dev

WORKDIR /opt/app

# App non-root user
ENV GROUP=app
ENV USER=flask
ENV UID=12345
ENV GID=23456

RUN addgroup --gid "$GID" "$GROUP" \
  && adduser --uid "$UID" \
    --disabled-password \
    --gecos "" \
    --ingroup "$GROUP" \
    "$USER"

# Copy requirements BEFORE switching user
COPY requirements.txt .

# Install Python dependencies as root (IMPORTANT)
RUN pip install --no-cache-dir -r requirements.txt

# Now switch to non-root user
USER "$USER"
ENV PATH="/home/$USER/.local/bin:${PATH}"

# Copy app
COPY --chown=$USER:$GROUP . .

# Gunicorn is run from docker-compose