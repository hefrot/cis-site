#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-.}"
cd "$ROOT"

required=(
  about.html
  contact.html
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

html_files=(
  about.html
  contact.html
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
)

operational_files=("${html_files[@]}" apps-script/Code.gs assets/cis-consent.js)
failures=0

pass() { printf 'PASS  %s\n' "$*"; }
fail() { printf 'FAIL  %s\n' "$*" >&2; failures=$((failures + 1)); }

for file in "${required[@]}"; do
  if [[ -s "$file" ]]; then pass "$file exists"; else fail "$file missing or empty"; fi
done

scan_forbidden() {
  local label="$1"
  local pattern="$2"
  shift 2
  if grep -niE "$pattern" "$@" >/tmp/cis-qa-match.txt 2>/dev/null; then
    fail "$label"
    sed -n '1,20p' /tmp/cis-qa-match.txt >&2
  else
    pass "$label absent"
  fi
}

scan_forbidden 'Formspree transport found' 'formspree\.io|Formspree' "${operational_files[@]}"
scan_forbidden 'old invoice surcharge found' '\$1,900 MXN \+ IVA|\$1,900 \+ IVA|precio es[^<]{0,30}\+ IVA|más IVA vigente|mas IVA vigente' "${operational_files[@]}"
scan_forbidden 'conditional Hector role found' 'cuando su disponibilidad lo permita' "${operational_files[@]}"
scan_forbidden 'monthly product wording found' 'pago mensual|suscripción mensual|renovación automática activa|cobro recurrente activo' "${operational_files[@]}"

if grep -niE "href=[\"']/register(\\.html)?[\"']" "${html_files[@]}" >/tmp/cis-qa-register.txt 2>/dev/null; then
  fail 'public CTA points to /register'
  cat /tmp/cis-qa-register.txt >&2
else
  pass 'no public CTA points to /register'
fi

if grep -niE 'googletagmanager\.com/gtag|gtag\(' "${html_files[@]}" >/tmp/cis-qa-ga.txt 2>/dev/null; then
  fail 'direct analytics loader found in HTML; analytics must be consent-gated'
  cat /tmp/cis-qa-ga.txt >&2
else
  pass 'no direct analytics loader in HTML'
fi

required_text_checks=(
  'index.html|/inscripcion.html'
  'index.html|\$1,900 MXN'
  'index.html|\$1,999 MXN'
  'index.html|/proveedor.html'
  'index.html|/cancelacion.html'
  'terms.html|CIS-TERMS-2026-07-30-v2'
  'terms.html|5 días hábiles'
  'terms.html|mayores de 18 años'
  'privacy.html|CIS-PRIVACY-2026-07-30-v2'
  'privacy.html|Derechos ARCO'
  'inscripcion.html|form_type" value="reservation'
  'inscripcion.html|CIS-TERMS-2026-07-30-v2'
  'inscripcion.html|CIS-PRIVACY-2026-07-30-v2'
  'bienvenida.html|form_type" value="onboarding'
  'bienvenida.html|payment_method'
  'cancelacion.html|form_type" value="consumer_request'
  'payment.html|https://buy\.stripe\.com/fZu7sL9Gy9jBa7faOV3Je0p'
  'payment.html|pago único'
  'payment.html|sin costo adicional'
  'assets/cis-consent.js|G-BPRSKDJ26'
  'apps-script/Code.gs|Evidencia legal'
  'apps-script/Code.gs|Aclaraciones y cancelaciones'
  'apps-script/Code.gs|consumer_request'
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
  if python3 - <<'PY'
from html.parser import HTMLParser
from pathlib import Path

files = [
    'about.html','contact.html',
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
  then
    :
  else
    fail 'Python HTML parser rejected one or more pages'
  fi
fi

rm -f /tmp/cis-qa-match.txt /tmp/cis-qa-register.txt /tmp/cis-qa-ga.txt

if (( failures > 0 )); then
  printf '\nRESULT: FAIL (%d issue(s))\n' "$failures" >&2
  exit 1
fi

printf '\nRESULT: PASS\n'
