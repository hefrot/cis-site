const SPREADSHEET_ID = '1sjAb4tX9VSJ27eQPD2OmmkjetRbMRXOEIL4lHVRTgfM';
const PROSPECTS_SHEET = 'Prospectos';
const STUDENTS_SHEET = 'Alumnos y acuerdos';
const EVIDENCE_SHEET = 'Evidencia legal';
const REQUESTS_SHEET = 'Aclaraciones y cancelaciones';

const STRIPE_PAYMENT_URL = 'https://buy.stripe.com/fZu7sL9Gy9jBa7faOV3Je0p';
const SPEI_CONFIRMATION_URL = 'https://cis.hmena.com/thanks.html?method=spei';
const ONBOARDING_CONFIRMATION_URL = 'https://cis.hmena.com/bienvenida-gracias.html';
const CONSUMER_REQUEST_CONFIRMATION_URL = 'https://cis.hmena.com/cancelacion-gracias.html';
const RESERVATION_URL = 'https://cis.hmena.com/inscripcion.html';
const ONBOARDING_URL = 'https://cis.hmena.com/bienvenida.html';
const CONSUMER_REQUEST_URL = 'https://cis.hmena.com/cancelacion.html';
const TERMS_URL = 'https://cis.hmena.com/terms.html';
const PRIVACY_URL = 'https://cis.hmena.com/privacy.html';
const PROVIDER_URL = 'https://cis.hmena.com/proveedor.html';
const NOTIFICATION_EMAIL = 'capinvestorschool@gmail.com';

const TERMS_VERSION = 'CIS-TERMS-2026-07-30-v2';
const PRIVACY_VERSION = 'CIS-PRIVACY-2026-07-30-v2';

function doPost(e) {
  const data = e && e.parameter ? e.parameter : {};
  const formType = clean(data.form_type || 'reservation').toLowerCase();
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(15000);
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);

    if (formType === 'onboarding') return handleOnboarding(spreadsheet, data);
    if (formType === 'consumer_request') return handleConsumerRequest(spreadsheet, data);
    return handleReservation(spreadsheet, data);
  } catch (error) {
    console.error(error);
    const returnUrl = formType === 'onboarding'
      ? ONBOARDING_URL
      : formType === 'consumer_request'
        ? CONSUMER_REQUEST_URL
        : RESERVATION_URL;
    return errorPage(returnUrl);
  } finally {
    try { lock.releaseLock(); } catch (ignored) {}
  }
}

function handleReservation(spreadsheet, data) {
  requireFields(data, ['name', 'whatsapp', 'payment_preference']);
  requireYes(data, 'accept_terms');
  requireYes(data, 'accept_privacy');
  requireYes(data, 'consent_contact_and_data');

  const sheet = requireSheet(spreadsheet, PROSPECTS_SHEET);
  const now = new Date();
  const prospectId = Utilities.getUuid();
  const evidenceId = Utilities.getUuid();
  const name = clean(data.name);
  const email = clean(data.email).toLowerCase();
  const whatsapp = clean(data.whatsapp);
  const paymentPreference = clean(data.payment_preference);
  const isStripe = /stripe|tarjeta/i.test(paymentPreference);
  const destination = isStripe ? STRIPE_PAYMENT_URL : SPEI_CONFIRMATION_URL;
  const amount = isStripe ? 1999 : 1900;
  const termsVersion = clean(data.terms_version || TERMS_VERSION);
  const privacyVersion = clean(data.privacy_version || PRIVACY_VERSION);

  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    const rows = sheet.getRange(2, 1, lastRow - 1, Math.min(sheet.getLastColumn(), 18)).getDisplayValues();
    const duplicate = rows.some(function (row) { return clean(row[4]) === whatsapp; });
    if (duplicate) return successPage(destination, 'Tu reserva ya estaba registrada.');
  }

  sheet.appendRow([
    now,
    prospectId,
    name,
    email,
    whatsapp,
    '',
    clean(data.referral_source || 'Landing CIS'),
    '',
    '',
    paymentPreference,
    '',
    isStripe ? 'Reserva iniciada — Stripe' : 'Reserva iniciada — SPEI',
    'Héctor',
    isStripe
      ? 'Verificar pago en Stripe y enviar formulario de bienvenida'
      : 'Enviar datos bancarios verificados por WhatsApp',
    'Reserva mínima antes del pago',
    clean(data.source_page || 'cis.hmena.com/inscripcion.html'),
    clean(data.form_version || '2026-07-30-v6-profeco'),
    'Sí'
  ]);

  appendEvidence(spreadsheet, [
    now,
    evidenceId,
    'Reserva y aceptación precontractual',
    prospectId,
    name,
    email,
    whatsapp,
    paymentPreference,
    amount,
    termsVersion,
    privacyVersion,
    'Sí',
    'Sí',
    'Sí',
    clean(data.user_agent),
    clean(data.source_page || 'cis.hmena.com/inscripcion.html'),
    'Registrado',
    'Reserva no equivale a pago confirmado'
  ]);

  sendInternalReservationNotice(name, email, whatsapp, paymentPreference, prospectId, evidenceId);
  if (email) sendReservationReceipt(email, name, paymentPreference, amount, prospectId, evidenceId, isStripe);

  return successPage(destination, 'Tu reserva fue registrada. Folio: ' + prospectId);
}

function handleOnboarding(spreadsheet, data) {
  requireFields(data, [
    'payment_reference',
    'payment_method',
    'name',
    'email',
    'whatsapp',
    'country_city',
    'experience',
    'interest',
    'learning_goal',
    'invoice_required'
  ]);

  [
    'accept_schedule',
    'accept_academic_policy',
    'accept_education_nature',
    'accept_recordings',
    'accept_terms',
    'accept_privacy'
  ].forEach(function (field) { requireYes(data, field); });

  const invoiceRequired = clean(data.invoice_required);
  if (/^s[ií]/i.test(invoiceRequired)) {
    requireFields(data, ['tax_id', 'legal_name', 'cfdi_use', 'tax_address']);
  }

  const sheet = requireSheet(spreadsheet, STUDENTS_SHEET);
  const now = new Date();
  const agreementId = Utilities.getUuid();
  const evidenceId = Utilities.getUuid();
  const paymentReference = clean(data.payment_reference);
  const paymentMethod = clean(data.payment_method);
  const isStripe = /stripe|tarjeta/i.test(paymentMethod);
  const amount = isStripe ? 1999 : 1900;
  const name = clean(data.name);
  const email = clean(data.email).toLowerCase();
  const whatsapp = clean(data.whatsapp);
  const termsVersion = clean(data.terms_version || TERMS_VERSION);
  const privacyVersion = clean(data.privacy_version || PRIVACY_VERSION);

  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    const rows = sheet.getRange(2, 1, lastRow - 1, Math.min(sheet.getLastColumn(), 25)).getDisplayValues();
    const duplicate = rows.some(function (row) {
      return clean(row[3]) === paymentReference && clean(row[6]) === whatsapp;
    });
    if (duplicate) return successPage(ONBOARDING_CONFIRMATION_URL, 'Tu formulario de bienvenida ya estaba registrado.');
  }

  sheet.appendRow([
    now,
    agreementId,
    clean(data.prospect_id),
    paymentReference,
    name,
    email,
    whatsapp,
    clean(data.country_city),
    clean(data.experience),
    clean(data.interest),
    clean(data.learning_goal),
    invoiceRequired,
    clean(data.tax_id),
    clean(data.legal_name),
    clean(data.cfdi_use),
    clean(data.tax_address),
    'Sí',
    'Sí',
    'Sí',
    'Sí',
    'Sí',
    termsVersion,
    'Onboarding recibido — pendiente de validación final de pago',
    'Héctor',
    'Método: ' + paymentMethod + (clean(data.notes) ? ' · ' + clean(data.notes) : '')
  ]);

  appendEvidence(spreadsheet, [
    now,
    evidenceId,
    'Acuerdo de participación y onboarding',
    agreementId,
    name,
    email,
    whatsapp,
    paymentMethod,
    amount,
    termsVersion,
    privacyVersion,
    'Sí',
    'Sí',
    'Sí',
    clean(data.user_agent),
    clean(data.source_page || 'cis.hmena.com/bienvenida.html'),
    'Registrado',
    'Referencia: ' + paymentReference
  ]);

  MailApp.sendEmail({
    to: NOTIFICATION_EMAIL,
    subject: 'Formulario de bienvenida CIS — ' + name,
    htmlBody:
      '<p>Se recibió el formulario posterior al pago.</p>' +
      '<p><strong>Nombre:</strong> ' + escapeHtml(name) + '<br>' +
      '<strong>Correo LMS:</strong> ' + escapeHtml(email) + '<br>' +
      '<strong>WhatsApp:</strong> ' + escapeHtml(whatsapp) + '<br>' +
      '<strong>Método:</strong> ' + escapeHtml(paymentMethod) + '<br>' +
      '<strong>Referencia:</strong> ' + escapeHtml(paymentReference) + '<br>' +
      '<strong>Factura:</strong> ' + escapeHtml(invoiceRequired) + '<br>' +
      '<strong>Acuerdo:</strong> ' + escapeHtml(agreementId) + '</p>' +
      '<p>Revisa Alumnos y acuerdos y Evidencia legal.</p>'
  });

  sendOnboardingReceipt(email, name, agreementId, paymentMethod, amount, paymentReference, termsVersion);
  return successPage(ONBOARDING_CONFIRMATION_URL, 'Tu información fue recibida. Folio de acuerdo: ' + agreementId);
}

function handleConsumerRequest(spreadsheet, data) {
  requireFields(data, ['request_type', 'name', 'email', 'whatsapp', 'reason', 'requested_resolution']);
  requireYes(data, 'accept_privacy');

  const sheet = requireSheet(spreadsheet, REQUESTS_SHEET);
  const now = new Date();
  const requestId = Utilities.getUuid();
  const requestType = clean(data.request_type);
  const purchaseDate = parseDateOrBlank(data.purchase_date);
  const withinFiveBusinessDays = purchaseDate
    ? (businessDaysBetween(purchaseDate, now) <= 5 ? 'Sí — sujeto a verificación' : 'No / por revisar')
    : 'No determinado';
  const responseDeadline = addBusinessDays(now, 5);
  const name = clean(data.name);
  const email = clean(data.email).toLowerCase();
  const whatsapp = clean(data.whatsapp);

  sheet.appendRow([
    now,
    requestId,
    requestType,
    name,
    email,
    whatsapp,
    clean(data.payment_reference),
    purchaseDate || '',
    clean(data.reason),
    clean(data.requested_resolution),
    withinFiveBusinessDays,
    'Recibida — pendiente de análisis',
    'Héctor',
    responseDeadline,
    'Privacidad aceptada: ' + clean(data.privacy_version || PRIVACY_VERSION)
  ]);

  appendEvidence(spreadsheet, [
    now,
    Utilities.getUuid(),
    'Solicitud de consumidor',
    requestId,
    name,
    email,
    whatsapp,
    '',
    '',
    clean(data.terms_version || TERMS_VERSION),
    clean(data.privacy_version || PRIVACY_VERSION),
    '',
    'Sí',
    'Sí',
    clean(data.user_agent),
    clean(data.source_page || 'cis.hmena.com/cancelacion.html'),
    'Registrado',
    requestType
  ]);

  MailApp.sendEmail({
    to: NOTIFICATION_EMAIL,
    subject: 'Solicitud de consumidor CIS — ' + requestType + ' — ' + requestId,
    htmlBody:
      '<p>Se recibió una solicitud de consumidor.</p>' +
      '<p><strong>Folio:</strong> ' + escapeHtml(requestId) + '<br>' +
      '<strong>Tipo:</strong> ' + escapeHtml(requestType) + '<br>' +
      '<strong>Nombre:</strong> ' + escapeHtml(name) + '<br>' +
      '<strong>Correo:</strong> ' + escapeHtml(email) + '<br>' +
      '<strong>WhatsApp:</strong> ' + escapeHtml(whatsapp) + '<br>' +
      '<strong>Referencia:</strong> ' + escapeHtml(data.payment_reference) + '</p>' +
      '<p>Fecha objetivo de respuesta: ' + escapeHtml(formatDate(responseDeadline)) + '.</p>'
  });

  MailApp.sendEmail({
    to: email,
    subject: 'Acuse de solicitud CIS — folio ' + requestId,
    htmlBody:
      '<p>Hola ' + escapeHtml(name) + ':</p>' +
      '<p>Recibimos tu solicitud <strong>' + escapeHtml(requestType) + '</strong>.</p>' +
      '<p><strong>Folio:</strong> ' + escapeHtml(requestId) + '<br>' +
      '<strong>Fecha de recepción:</strong> ' + escapeHtml(formatDate(now)) + '<br>' +
      '<strong>Fecha objetivo de respuesta:</strong> ' + escapeHtml(formatDate(responseDeadline)) + '</p>' +
      '<p>Conserva este mensaje. Para agregar información responde a este correo e incluye el folio.</p>' +
      '<p>Capital Investor School · ' + escapeHtml(NOTIFICATION_EMAIL) + '</p>'
  });

  return successPage(CONSUMER_REQUEST_CONFIRMATION_URL, 'Solicitud recibida. Folio: ' + requestId);
}

function appendEvidence(spreadsheet, row) {
  requireSheet(spreadsheet, EVIDENCE_SHEET).appendRow(row);
}

function sendInternalReservationNotice(name, email, whatsapp, paymentPreference, prospectId, evidenceId) {
  MailApp.sendEmail({
    to: NOTIFICATION_EMAIL,
    subject: 'Nueva reserva CIS — ' + name + ' — ' + paymentPreference,
    htmlBody:
      '<p>Se inició una reserva para <strong>Aprende a Invertir desde Cero</strong>.</p>' +
      '<p><strong>Folio:</strong> ' + escapeHtml(prospectId) + '<br>' +
      '<strong>Evidencia:</strong> ' + escapeHtml(evidenceId) + '<br>' +
      '<strong>Nombre:</strong> ' + escapeHtml(name) + '<br>' +
      '<strong>WhatsApp:</strong> ' + escapeHtml(whatsapp) + '<br>' +
      '<strong>Correo opcional:</strong> ' + escapeHtml(email || 'No proporcionado') + '<br>' +
      '<strong>Método:</strong> ' + escapeHtml(paymentPreference) + '</p>'
  });
}

function sendReservationReceipt(email, name, method, amount, prospectId, evidenceId, isStripe) {
  MailApp.sendEmail({
    to: email,
    subject: 'Tu reserva CIS — folio ' + prospectId,
    htmlBody:
      '<p>Hola ' + escapeHtml(name) + ':</p>' +
      '<p>Registramos tu reserva para <strong>Aprende a Invertir desde Cero — CIS Foundations N1</strong>.</p>' +
      '<p><strong>Folio:</strong> ' + escapeHtml(prospectId) + '<br>' +
      '<strong>Método elegido:</strong> ' + escapeHtml(method) + '<br>' +
      '<strong>Monto total:</strong> $' + amount + ' MXN<br>' +
      '<strong>Modalidad:</strong> pago único' + (isStripe ? ' mediante Stripe' : ' mediante SPEI') + '</p>' +
      '<p>Esta reserva aún no confirma el pago ni el lugar. La confirmación se envía después de validar la operación.</p>' +
      '<p><a href="' + TERMS_URL + '">Términos</a> · <a href="' + PRIVACY_URL + '">Privacidad</a> · <a href="' + PROVIDER_URL + '">Proveedor</a></p>' +
      '<p><strong>Evidencia de aceptación:</strong> ' + escapeHtml(evidenceId) + '</p>'
  });
}

function sendOnboardingReceipt(email, name, agreementId, method, amount, reference, termsVersion) {
  MailApp.sendEmail({
    to: email,
    subject: 'Confirmación de bienvenida CIS — ' + agreementId,
    htmlBody:
      '<p>Hola ' + escapeHtml(name) + ':</p>' +
      '<p>Recibimos tu formulario de bienvenida y acuerdo de participación.</p>' +
      '<p><strong>Folio de acuerdo:</strong> ' + escapeHtml(agreementId) + '<br>' +
      '<strong>Método:</strong> ' + escapeHtml(method) + '<br>' +
      '<strong>Monto asociado:</strong> $' + amount + ' MXN<br>' +
      '<strong>Referencia:</strong> ' + escapeHtml(reference) + '<br>' +
      '<strong>Versión de términos:</strong> ' + escapeHtml(termsVersion) + '</p>' +
      '<p>CIS validará la operación y enviará calendario y acceso. Conserva este correo.</p>' +
      '<p><a href="' + TERMS_URL + '">Términos</a> · <a href="' + PRIVACY_URL + '">Privacidad</a></p>'
  });
}

function requireSheet(spreadsheet, sheetName) {
  const sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) throw new Error('Sheet not found: ' + sheetName);
  return sheet;
}

function requireFields(data, fields) {
  fields.forEach(function (field) {
    if (!clean(data[field])) throw new Error('Missing required field: ' + field);
  });
}

function requireYes(data, field) {
  if (clean(data[field]).toLowerCase() !== 'yes') {
    throw new Error('Required acceptance missing: ' + field);
  }
}

function clean(value) { return String(value || '').trim(); }

function parseDateOrBlank(value) {
  const raw = clean(value);
  if (!raw) return '';
  const date = new Date(raw + 'T12:00:00');
  return isNaN(date.getTime()) ? '' : date;
}

function addBusinessDays(start, count) {
  const date = new Date(start);
  let added = 0;
  while (added < count) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return date;
}

function businessDaysBetween(start, end) {
  const current = new Date(start);
  current.setHours(12, 0, 0, 0);
  const finish = new Date(end);
  finish.setHours(12, 0, 0, 0);
  let count = 0;
  while (current < finish) {
    current.setDate(current.getDate() + 1);
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
  }
  return count;
}

function formatDate(date) {
  return Utilities.formatDate(new Date(date), 'America/Mexico_City', 'yyyy-MM-dd');
}

function successPage(url, message) {
  return HtmlService.createHtmlOutput(
    '<!doctype html><html lang="es"><meta charset="utf-8">' +
    '<meta http-equiv="refresh" content="3;url=' + escapeHtml(url) + '">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<body style="font-family:Arial,sans-serif;padding:32px">' +
    '<h1>' + escapeHtml(message) + '</h1><p>Guarda este folio. Te estamos redirigiendo…</p>' +
    '<p><a href="' + escapeHtml(url) + '">Continuar</a></p></body></html>'
  );
}

function errorPage(returnUrl) {
  return HtmlService.createHtmlOutput(
    '<!doctype html><html lang="es"><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<body style="font-family:Arial,sans-serif;padding:32px">' +
    '<h1>No pudimos registrar la información</h1>' +
    '<p>No realices otro pago. Escríbenos por WhatsApp al +52 449 278 1853 o por correo a capinvestorschool@gmail.com.</p>' +
    '<p><a href="' + escapeHtml(returnUrl) + '">Volver</a></p></body></html>'
  );
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
