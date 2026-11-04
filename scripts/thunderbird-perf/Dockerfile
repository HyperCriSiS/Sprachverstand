FROM python:3.12-bookworm@sha256:a5bab0ff300f91231c2e68bf73a8a8d60762ac39ce1c50eaf6803e4c38a9062b
RUN apt-get update && apt-get install -y --no-install-recommends thunderbird xvfb xauth ca-certificates && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir marionette_driver==3.7.1
WORKDIR /qa
