# CIS V4 — Embudo de conversión aprobado

## Objetivo

Conservar la calidad visual premium de la V3 local del VPS, pero reducir fricción y decisiones antes del pago.

La landing debe vender una transformación clara:

> Aprende a invertir desde cero sin arriesgar dinero antes de entenderlo.

No usar promesas de rendimiento, urgencia falsa, contadores falsos, testimonios no verificados ni credenciales inventadas.

## Flujo definitivo

1. Landing pública `/`
2. Reserva mínima `/inscripcion.html`
3. Elección de pago:
   - SPEI: `$1,900 MXN`, opción recomendada
   - Stripe: `$1,999 MXN`, pago único
4. Confirmación:
   - SPEI → `/thanks.html?method=spei`
   - Stripe → Payment Link oficial
5. Después de validar el pago, CIS envía `/bienvenida.html`
6. El alumno completa datos, facturación y acuerdo de participación
7. Confirmación en `/bienvenida-gracias.html`
8. Acceso al LMS y calendario

## Landing

### Regla principal

Una sola acción comercial repetida:

**Reservar mi lugar — desde $1,900 MXN**

Todos los CTA principales deben apuntar a `/inscripcion.html`.

### Contenido visible en menos de 5 segundos

- Aprende a Invertir desde Cero
- Curso en vivo para principiantes
- Inicio: 21 de septiembre de 2026
- 10 sesiones / 20 horas
- Precio principal: $1,900 MXN
- Botón: Reservar mi lugar

### Jerarquía

1. Problema: invertir sin entender puede generar errores evitables.
2. Transformación: comprender mercados, evaluar instrumentos y aplicar gestión de riesgo.
3. Oferta: 10 sesiones en vivo, proyecto final, grabaciones y seguimiento.
4. Confianza: instructores reales, fechas exactas, pagos identificados, términos y contacto.
5. Acción: reservar.

### Interactividad útil

- Hero con profundidad visual ligera, no 3D pesado.
- Mini recorrido interactivo de tres pasos:
  1. Reserva
  2. Pago
  3. Acceso
- Programa de 10 sesiones en acordeón o tarjetas expandibles.
- FAQ en acordeón.
- CTA fijo en móvil.
- Hover/tap discretos.
- `prefers-reduced-motion` respetado.

### Reducción de información

No eliminar información esencial, pero presentarla progresivamente:

- Hero: propuesta, fecha, duración y precio.
- Beneficios: máximo 6 resultados claros.
- Programa: inicialmente resumido y expandible.
- Políticas: resumen breve con enlace a términos.
- FAQ: respuestas cortas.

No mostrar en la landing preguntas de perfil ni facturación.

## Reserva mínima `/inscripcion.html`

Usar la lógica ya comprometida en GitHub.

Campos visibles únicamente:

- Nombre completo, obligatorio
- WhatsApp con lada, obligatorio
- Correo, opcional
- Una aceptación combinada de términos, privacidad y autorización de contacto

Métodos como botones, no `select`:

- **Reservar con SPEI — $1,900 MXN**
- **Pagar con tarjeta — $1,999 MXN, pago único**

No pedir antes del pago:

- país/ciudad
- experiencia
- interés
- fuente
- objetivo
- factura
- RFC
- comentarios

## Bienvenida posterior al pago `/bienvenida.html`

Usar la lógica y nombres de campo ya comprometidos en GitHub.

Aquí sí recopilar:

- referencia de pago
- nombre
- correo LMS
- WhatsApp
- país/ciudad
- experiencia
- interés
- objetivo
- facturación condicional
- aceptación de fechas
- política académica
- naturaleza educativa
- condiciones de grabaciones
- términos y privacidad

Presentar como onboarding, no como una segunda venta.

## Apps Script

Usar exactamente la nueva versión de `apps-script/Code.gs` de la rama.

Tipos:

- `form_type=reservation`
- `form_type=onboarding`

Hojas:

- `Prospectos`
- `Alumnos y acuerdos`

No volver a requerir los campos largos en la reserva.

## Requisitos legales y de confianza

Antes del pago deben estar accesibles:

- servicio comprado
- modalidad
- fechas y horario
- precio total
- qué incluye
- mínimo de apertura
- reprogramación o devolución si CIS no abre
- política de cancelación voluntaria
- naturaleza interna de la constancia
- grabaciones
- aclaración de educación financiera general
- privacidad
- contacto

El formulario posterior no puede introducir costos ni restricciones materiales nuevas.

## Validaciones

- Ningún CTA comercial apunta a `/register.html`.
- Todos apuntan a `/inscripcion.html`.
- Apps Script exacto y actualizado.
- Stripe oficial exacto.
- Sin Formspree.
- Sin pagos mensuales.
- Sin contenido prohibido.
- Reserva funcional con SPEI y Stripe.
- Onboarding funcional.
- Capturas de home y reserva en 1440, 768 y 375 px.
- Capturas de bienvenida en 1440 y 375 px.
- No desplegar hasta aprobación visual y prueba del Apps Script actualizado.

## Entrega de Codex

- Incorporar la V3 premium local al repositorio.
- Aplicar este documento sobre esa V3.
- Mantener árbol limpio.
- Commit y push a `agent/cis-foundations-landing-payments-20260728`.
- Generar capturas.
- No desplegar producción.
