# V5 — Integración visual premium + PROFECO

Este documento controla la integración de la V3 premium local del VPS con el paquete legal y de conversión del PR.

## Regla de fuente

- Preservar el diseño premium local: hero, imágenes, profundidad visual, programa, instructores y responsive.
- Preservar la lógica y documentos legales del HEAD remoto.
- No sustituir `apps-script/Code.gs`, `inscripcion.html`, `bienvenida.html`, `terms.html`, `privacy.html`, `payment.html`, `cancelacion.html` ni `assets/cis-consent.js` por versiones locales antiguas.
- No desplegar hasta completar los bloqueos documentales y técnicos.

## Integración de `index.html`

Aplicar la riqueza visual de la V3, pero conservar:

- CTA único a `/inscripcion.html`.
- SPEI $1,900 MXN total.
- Stripe $1,999 MXN total y pago único.
- CFDI sin costo adicional.
- Inicio, duración, horario, cupo y naturaleza educativa.
- Compra dirigida a mayores de 18 años; menores solo con autorización de tutor.
- Revocación dentro de 5 días hábiles.
- Identidad del proveedor y enlaces legales.
- Sin GA4 hardcoded. Cargar únicamente `/assets/cis-consent.js`.
- Footer con proveedor, términos, privacidad, cookies, código de ética, cancelación y LMS.

## Archivos que deben copiarse al release

- `index.html`
- `inscripcion.html`
- `payment.html`
- `thanks.html`
- `bienvenida.html`
- `bienvenida-gracias.html`
- `proveedor.html`
- `terms.html`
- `privacy.html`
- `cookies.html`
- `codigo-etica.html`
- `cancelacion.html`
- `cancelacion-gracias.html`
- `assets/cis-consent.js`
- assets visuales aprobados

## QA textual

Fallar si aparece cualquiera:

- `formspree.io`
- `/register.html` como CTA comercial
- `$1,900 MXN + IVA`
- `cuando su disponibilidad lo permita`
- mensualidad, suscripción o renovación aplicada al producto
- acreditaciones, testimonios o cifras no verificadas
- Google Analytics cargado directamente antes del consentimiento

Confirmar:

- `CIS-TERMS-2026-07-30-v2`
- `CIS-PRIVACY-2026-07-30-v2`
- Apps Script exacto
- Stripe exacto
- precios totales
- links legales en footer

## QA Apps Script

Actualizar la implementación del Web App y probar:

1. `reservation`
   - folio en pantalla;
   - fila en `Prospectos`;
   - fila en `Evidencia legal`;
   - correo CIS;
   - acuse al consumidor si proporcionó correo;
   - redirección SPEI/Stripe.
2. `onboarding`
   - fila en `Alumnos y acuerdos`;
   - fila en `Evidencia legal`;
   - acuse al alumno;
   - método/monto correctos;
   - facturación condicional.
3. `consumer_request`
   - fila en `Aclaraciones y cancelaciones`;
   - fila en `Evidencia legal`;
   - folio;
   - acuse al consumidor;
   - fecha objetivo.

Eliminar filas de prueba después de conservar la evidencia del PASS.

## Bloqueo documental

Antes de desplegar páginas que exhiben el domicilio del proveedor, validar contra:

- Constancia de Situación Fiscal emitida en los últimos 3 meses.
- Comprobante de domicilio emitido en los últimos 3 meses.
- Identificación vigente y facultades del representante.

El domicilio actualmente cargado proviene de documentación histórica. Si difiere de los documentos vigentes, cambiarlo en todos los archivos y documentos antes de producción.

## Capturas

Generar y revisar:

- home 1440 / 768 / 375;
- inscripción 1440 / 375;
- payment 1440 / 375;
- bienvenida 1440 / 375;
- cancelación 1440 / 375;
- privacidad y términos móvil.

## Despliegue

Solo después de PASS documental y técnico:

- respaldo privado;
- hashes anteriores;
- release temporal;
- prueba HTTP local;
- intercambio de directorios;
- QA público;
- rollback automático ante fallo;
- no cambiar DNS, Nginx, LMS, API, n8n ni contenedores.
