# CIS — Paquete de cumplimiento PROFECO y comercio electrónico

**Versión:** 2026-07-30-v1  
**Proveedor:** C INV SCHOOL, S.A.S. de C.V.  
**RFC:** CIS210413U54  
**Nombre comercial:** Capital Investor School (CIS)  
**Representante:** Héctor Iván Mena Martínez  
**Sitio:** https://cis.hmena.com  

> Este paquete organiza la implementación y el expediente. No sustituye la revisión de un abogado mexicano ni acredita por sí solo el registro ante PROFECO.

## 1. Matriz pública de cumplimiento

| Elemento | Implementación | Estado |
|---|---|---|
| Razón social, RFC, domicilio y contacto | `proveedor.html`, `terms.html`, footer/checkout | Implementado; domicilio debe validarse con comprobante vigente antes de despliegue final |
| Contenido en español | Todas las páginas y procesos | Implementado |
| Descripción del servicio | Landing, `terms.html`, `payment.html` | Implementado |
| Precio total en MXN | SPEI $1,900; Stripe $1,999; impuestos/cargos obligatorios incluidos | Implementado |
| No suscripción | Stripe identificado como pago único, sin renovación automática | Implementado |
| Métodos de pago | SPEI y Stripe | Implementado |
| Proceso de compra | Landing → reserva → pago → bienvenida → acceso | Implementado |
| Entrega y acceso | 2 días hábiles para validación; acceso máximo 24 h antes de primera sesión si activación completa | Implementado |
| Comprobante electrónico | Acuse de reserva, folios, recibo de onboarding y confirmación manual/Stripe | Implementado en Apps Script; Stripe debe tener recibos habilitados |
| Facturación | CFDI por monto efectivamente pagado, sin cargo extra por facturar | Implementado; sustituye política anterior “+ IVA” |
| Revocación | 5 días hábiles desde compra | `terms.html`, `cancelacion.html`, Apps Script |
| Cancelación/devolución | Cohorte mínima, cancelación CIS, duplicados, transferencia | Implementado |
| Aclaraciones/reclamaciones | Formulario con folio, acuse y fecha objetivo | Implementado |
| Aviso de privacidad integral | `privacy.html` | Implementado |
| Aviso simplificado | `inscripcion.html` y formularios | Implementado |
| Finalidades promocionales separadas | No se obtiene consentimiento comercial dentro de aceptación operativa | Implementado |
| Cookies y analítica | `cookies.html` + `assets/cis-consent.js` | Implementado; eliminar GA4 hardcoded de la V3 antes de desplegar |
| Seguridad | HTTPS, Stripe, avisos contra 2FA/NIP/semillas | Implementado |
| Restricción de edad | 18+; menores solo con madre/padre/tutor | Código de ética y términos |
| Código de ética | `codigo-etica.html` | Implementado para publicación; adhesión oficial pendiente |
| Evidencia de aceptación | Hoja `Evidencia legal` y versiones de documentos | Implementado |
| Solicitudes del consumidor | Hoja `Aclaraciones y cancelaciones` | Implementado |
| Contrato/acuerdo posterior | `bienvenida.html` + documento Drive | Implementado como borrador; revisión legal pendiente |

## 2. Documentos públicos

- `/proveedor.html`
- `/terms.html`
- `/privacy.html`
- `/cookies.html`
- `/codigo-etica.html`
- `/cancelacion.html`
- `/cancelacion-gracias.html`
- `/inscripcion.html`
- `/payment.html`
- `/bienvenida.html`
- `/bienvenida-gracias.html`

Cada página debe enlazarse desde el footer de la landing y de los pasos de pago.

## 3. Evidencia y recibos

`apps-script/Code.gs` genera:

1. Folio de reserva.
2. Registro en `Prospectos`.
3. Evidencia con fecha, método, monto, versión de términos y privacidad, aceptación y user agent.
4. Acuse por correo cuando se proporcionó dirección.
5. Folio de acuerdo posterior al pago.
6. Registro en `Alumnos y acuerdos`.
7. Acuse de onboarding por correo.
8. Folio y acuse de revocación/cancelación/aclaración.
9. Fecha objetivo de respuesta de cinco días hábiles.

### Conservación

- Mantener exportaciones mensuales y respaldos con hash SHA-256.
- Limitar acceso a personas responsables.
- No almacenar datos completos de tarjeta, contraseñas, códigos 2FA, NIP o semillas.
- Para una constancia formal de conservación bajo NOM-151, contratar un Prestador de Servicios de Certificación acreditado. La hoja y los hashes internos no equivalen a dicha constancia.

## 4. Corrección fiscal y comercial obligatoria

La política previa “$1,900 + IVA si se solicita factura” queda **sustituida**.

Política canónica:

- SPEI: **$1,900 MXN, precio total**.
- Stripe: **$1,999 MXN, precio total y pago único**.
- Los importes incluyen impuestos y cargos obligatorios aplicables.
- Solicitar CFDI no genera costo adicional.
- El CFDI se emite por el monto efectivamente pagado cuando proceda y se reciben datos fiscales completos.

Actualizar Drive, anuncios, respuestas, payment link y materiales para no mostrar la política anterior.

## 5. Expediente para RCAL — registro voluntario del contrato

Preparar y presentar:

- [ ] Cuenta RCAL del representante.
- [ ] Identificación oficial vigente de Héctor Iván Mena Martínez.
- [ ] Constancia de Situación Fiscal de C INV SCHOOL emitida hace no más de 3 meses.
- [ ] Comprobante actual de domicilio emitido hace no más de 3 meses.
- [ ] Acta constitutiva / documento de constitución SAS.
- [ ] Documento que acredite facultades del representante, cuando aplique.
- [ ] Modelo de contrato en Word y PDF.
- [ ] Comprobante del pago de derechos.
- [ ] Solicitud electrónica y seguimiento.

**Estado:** el Drive contiene una constancia de 2022 y documentos internos de 2026, pero no se localizó una constancia fiscal ni comprobante de domicilio vigentes. No presentar el domicilio como verificado ante PROFECO hasta reunir esos documentos.

## 6. Código de Ética y Distintivo Digital

### Adhesión al Código de Ética

- Publicar `codigo-etica.html`.
- Revisar que el sitio exhiba todos los elementos de la matriz.
- Crear cuenta y presentar solicitud en el portal de PROFECO.
- Conservar el número de registro cuando sea aprobado.

### Distintivo Digital

El Distintivo es un reconocimiento voluntario posterior. El expediente normalmente exige información corporativa, domicilio físico en México, RFC, contacto, sitio, IP pública, comprobante de derechos, cumplimiento del Código de Ética y contrato de adhesión registrado. No mostrar un distintivo o número antes de aprobación oficial.

## 7. Validaciones antes de despliegue

- [ ] Domicilio y representante contrastados contra documentos vigentes.
- [ ] Apps Script desplegado con la versión actual de `Code.gs`.
- [ ] Pruebas `reservation`, `onboarding` y `consumer_request`.
- [ ] Acuses recibidos en correo del consumidor y CIS.
- [ ] Filas correctas en las cuatro hojas.
- [ ] Stripe con producto, precio MXN, pago único, descriptor y recibos correctos.
- [ ] La página de Stripe no presenta mensualidad o cargo futuro.
- [ ] GA4 solo carga tras consentimiento.
- [ ] Footer enlaza documentos legales.
- [ ] Ningún archivo contiene `formspree.io`.
- [ ] Ninguna página contiene “$1,900 + IVA”.
- [ ] Ningún CTA público apunta a `/register.html`.
- [ ] Capturas 1440/768/375 aprobadas.
- [ ] Respaldo y rollback antes del despliegue.

## 8. Operación después de cada pago

1. Identificar pago y reserva.
2. Registrar en `Ventas y pagos`.
3. Enviar confirmación de compra con descripción, monto total, método, fecha, folio y términos aceptados.
4. Enviar enlace individual de bienvenida.
5. Validar acuerdo y datos fiscales.
6. Emitir CFDI cuando proceda.
7. Dar acceso y enviar calendario.
8. Mantener canal de aclaración y revocación.

## 9. No afirmar hasta contar con evidencia

- “Contrato registrado ante PROFECO”.
- “Tienda verificada por PROFECO”.
- “Adherido al Código de Ética PROFECO”.
- “Distintivo Digital PROFECO”.
- “Evidencia certificada NOM-151”.

Estas afirmaciones solo pueden usarse después de recibir el registro, resolución o constancia oficial correspondiente.
