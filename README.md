# CIS — Capital Investor School (GitHub Pages)

Sitio estático listo para publicar gratis en GitHub Pages.

## Publicación
1. Crea un repo público (p. ej. `cis-site`) y sube **todo este contenido** al branch `main`.
2. Repo → Settings → Pages → **Build and deployment: GitHub Actions** (el workflow ya está en `.github/workflows/pages.yml`).
3. (Opcional) Custom domain: escribe `cis.hmena.com` y en tu DNS crea un CNAME `cis` → `TU_USUARIO.github.io`. Activa *Enforce HTTPS*.

## Formularios
Los formularios operativos de reserva, onboarding y atención al consumidor utilizan el Apps Script canónico. `/contact.html` publica únicamente los canales oficiales de WhatsApp y correo.

## Assets / PDFs
Coloca tus PDFs en `/assets/` con los nombres:
- `CIS_Glosario_Bolsa.pdf`
- `CIS_Calculadora_Riesgo.pdf`
- `CIS_Diario_Trading.pdf`

## Analytics
GA4 ya está incluido (`G-BPRSKDJ26`). Realtime debe registrar tus visitas y eventos básicos.
