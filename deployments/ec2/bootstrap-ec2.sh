#!/usr/bin/env bash
set -euo pipefail

if ! id -u mindbliss >/dev/null 2>&1; then
  sudo useradd --system --create-home --shell /sbin/nologin mindbliss
fi

sudo install -d -o mindbliss -g mindbliss /opt/mindbliss
sudo install -d -m 0750 -o root -g mindbliss /etc/mindbliss /etc/vp-engine /etc/vp-engine/tls
sudo install -d -m 0755 /var/log/caddy /var/log/vp-engine

if command -v dnf >/dev/null 2>&1; then
  sudo dnf update -y
  sudo dnf install -y curl git tar gzip ca-certificates
  if ! command -v node >/dev/null 2>&1 || ! node -e 'process.exit(Number(process.versions.node.split(".")[0]) >= 20 ? 0 : 1)'; then
    curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
    sudo dnf install -y nodejs
  fi
  if ! command -v caddy >/dev/null 2>&1; then
    sudo dnf install -y 'dnf-command(copr)' || true
    sudo dnf copr enable -y @caddy/caddy || true
    sudo dnf install -y caddy || true
  fi
elif command -v apt-get >/dev/null 2>&1; then
  sudo apt-get update
  sudo apt-get install -y curl git tar gzip ca-certificates gnupg
  if ! command -v node >/dev/null 2>&1 || ! node -e 'process.exit(Number(process.versions.node.split(".")[0]) >= 20 ? 0 : 1)'; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
  fi
  sudo apt-get install -y caddy || true
else
  echo "Unsupported Linux package manager. Install Node.js 22+ and Caddy manually." >&2
fi

node --version
npm --version

if command -v caddy >/dev/null 2>&1; then
  sudo systemctl enable caddy
fi
