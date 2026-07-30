#!/usr/bin/env bash
set -euo pipefail

DOMAIN="cis.hmena.com"
EXPECTED_IP="89.116.30.70"

section() {
  printf '\n===== %s =====\n' "$1"
}

section "Timestamp and host"
date -u +'%Y-%m-%dT%H:%M:%SZ'
hostname -f 2>/dev/null || hostname
uname -a

section "Public DNS resolution"
if command -v dig >/dev/null 2>&1; then
  dig +short A "$DOMAIN" || true
  dig +short CNAME "$DOMAIN" || true
else
  getent ahostsv4 "$DOMAIN" || true
fi
printf 'Expected current A record: %s\n' "$EXPECTED_IP"

section "Listening web ports"
ss -ltnp 2>/dev/null | grep -E ':(80|443)\b' || true

section "Detected web services"
for svc in nginx apache2 httpd caddy; do
  if systemctl list-unit-files --type=service 2>/dev/null | grep -q "^${svc}\.service"; then
    systemctl is-active "$svc" 2>/dev/null || true
    systemctl is-enabled "$svc" 2>/dev/null || true
  fi
done

section "Nginx configuration matches"
if command -v nginx >/dev/null 2>&1; then
  nginx -t 2>&1 || true
  nginx -T 2>&1 | grep -n -B4 -A15 -E "server_name[[:space:]].*${DOMAIN//./\\.}" || true
  grep -RIn --include='*.conf' --include='*' "$DOMAIN" /etc/nginx 2>/dev/null || true
else
  echo "nginx not installed"
fi

section "Apache configuration matches"
if command -v apache2ctl >/dev/null 2>&1; then
  apache2ctl -S 2>&1 || true
  grep -RIn --include='*.conf' "$DOMAIN" /etc/apache2 2>/dev/null || true
elif command -v httpd >/dev/null 2>&1; then
  httpd -S 2>&1 || true
  grep -RIn --include='*.conf' "$DOMAIN" /etc/httpd 2>/dev/null || true
else
  echo "apache/httpd not installed"
fi

section "Likely document roots and reverse-proxy targets"
for base in /var/www /srv/www /opt /home; do
  [ -d "$base" ] || continue
  grep -RIl --exclude-dir=.git --exclude='*.log' -m1 'CIS Foundations N1\|Mercados y Capital\|Capital Investor School' "$base" 2>/dev/null | head -50 || true
done

section "TLS certificate"
if command -v openssl >/dev/null 2>&1; then
  timeout 12 openssl s_client -connect "${DOMAIN}:443" -servername "$DOMAIN" </dev/null 2>/dev/null \
    | openssl x509 -noout -subject -issuer -dates -ext subjectAltName 2>/dev/null || true
fi

section "HTTP response headers"
if command -v curl >/dev/null 2>&1; then
  curl -sSIL --max-time 15 "http://${DOMAIN}/" || true
  curl -sSIL --max-time 15 "https://${DOMAIN}/" || true
  printf '\nLocal request with Host header:\n'
  curl -sSIL --max-time 15 -H "Host: ${DOMAIN}" http://127.0.0.1/ || true
fi

section "Containers exposing web ports"
if command -v docker >/dev/null 2>&1; then
  docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Ports}}' || true
fi
if command -v podman >/dev/null 2>&1; then
  podman ps --format 'table {{.Names}}\t{{.Image}}\t{{.Ports}}' || true
fi

section "Safety statement"
echo "READ-ONLY diagnostic complete. No files, services, DNS records, or certificates were changed."
