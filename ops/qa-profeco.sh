#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-.}"
cd "$ROOT"

required=(
  index.html
  inscripcion.html
  payment.html
  thanks.html
  bienvenida.html
  bienvenida-gracias.html
  proveedor.html
  terms.html
  privacy.html
  cookies.html
  codigo-etica.html
  cancelacion.html
  cancelacion-gracias.html
  assets/cis-consent.js
  apps-script/Code.gs
)

failures=0

pass() { printf 'PASS  %s\n' "$*"; }
fail() { printf 'FAIL  %s\n' "$*" >&2; failures=$((failures + 1)); }

for file in "${required[@]}"; do
  if [[ -s "$file" ]]; then pass "$file exists"; else fail "$file missing or empty"; fi
done

html_files=(index.html inscripcion.html payment.html thanks.html bienvenida.html bienvenida-gracias.html proveedor.html terms.html privacy.html cookies.html codigo-etica.html cancelacion.html cancelacion-gracias.html)

forbidden_checks=(
  'formspree\.io|Formspree'
  '\$1,900 MXN \+ IVA|\$1,900 \+ IVA|más IVA vigente|mas IVA vigente'
  'cuando su disponibilidad lo permita'
  'pago mensual|mensualidad|renovación automática activa|suscripción mensual'
)

for pattern in "${forbidden_checks[@]}"; do
  if grep -RniE --include='*.html' --include='*.gs' --include='*.md' "$pattern" . >/tmp/cis-qa-match.txt 2>/dev/null; then
    fail "forbidden pattern found: $pattern"
    sed -n '1,20p' /tmp/cis-qa-match.txt >&2
  else
    pass "forbidden pattern absent: $pattern"
  fi
done

if grep -RniE --include='*.html' 'href=["'"']/register(\.html)?["'"']' . >/tmp/cis-qa-register.txt 2>/dev/null; then
  fail 'public CTA points to /register'
  cat /tmp/cis-qa-register.txt >&2
else
  pass 'no public CTA points to /register'
fi

if grep -RniE --include='*.html' 'googletagmanager\.com/gtag|gtag\(' . >/tmp/cis-qa-ga.txt 2>/dev/null; then
  fail 'direct analytics loader found in HTML; analytics must be consent-gated'
  cat /tmp/cis-qa-ga.txt >&2
else
  pass 'no direct analytics loader in HTML'
fi

required_text_checks=(
  'index.html|/inscripcion.html'
  'index.html|\$1,900 MXN'
  'index.html|\$1,999 MXN'
  'terms.html|CIS-TERMS-2026-07-30-v2'
  'terms.html|5 días hábiles'
  'privacy.html|CIS-PRIVACY-2026-07-30-v2'
  'privacy.html|Derechos ARCO'
  'inscripcion.html|form_type" value="reservation'
  'inscripcion.html|CIS-TERMS-2026-07-30-v2'
  'inscripcion.html|CIS-PRIVACY-2026-07-30-v2'
  'bienvenida.html|form_type" value="onboarding'
  'cancelacion.html|form_type" value="consumer_request'
  'payment.html|https://buy\.stripe\.com/fZu7sL9Gy9jBa7faOV3Je0p'
  'payment.html|pago único'
  'assets/cis-consent.js|G-BPRSKDJ26'
  'apps-script/Code.gs|Evidencia legal'
  'apps-script/Code.gs|Aclaraciones y cancelaciones'
)

for check in "${required_text_checks[@]}"; do
  file="${check%%|*}"
  pattern="${check#*|}"
  if grep -qiE "$pattern" "$file"; then pass "$file contains $pattern"; else fail "$file missing $pattern"; fi
done

for file in "${html_files[@]}"; do
  if grep -qi '<html' "$file" && grep -qi '</html>' "$file"; then
    pass "$file has HTML envelope"
  else
    fail "$file lacks complete HTML envelope"
  fi
done

if command -v python3 >/dev/null 2>&1; then
  python3 - <<'PY' || failures=$((failures + 1))
from html.parser import HTMLParser
from pathlib import Path

files = [
    'index.html','inscripcion.html','payment.html','thanks.html','bienvenida.html',
    'bienvenida-gracias.html','proveedor.html','terms.html','privacy.html',
    'cookies.html','codigo-etica.html','cancelacion.html','cancelacion-gracias.html'
]

class Parser(HTMLParser):
    pass

for name in files:
    parser = Parser()
    parser.feed(Path(name).read_text(encoding='utf-8'))
print('PASS  Python HTML parser accepted all public pages')
PY
fi

rm -f /tmp/cis-qa-match.txt /tmp/cis-qa-register.txt /tmp/cis-qa-ga.txt

if (( failures > 0 )); then
  printf '\nRESULT: FAIL (%d issue(s))\n' "$failures" >&2
  exit 1
fi

printf '\nRESULT: PASS\n'
