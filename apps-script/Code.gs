const SPREADSHEET_ID = '1sjAb4tX9VSJ27eQPD2OmmkjetRbMRXOEIL4lHVRTgfM';
const PROSPECTS_SHEET = 'Prospectos';
const STUDENTS_SHEET = 'Alumnos y acuerdos';

const STRIPE_PAYMENT_URL = 'https://buy.stripe.com/fZu7sL9Gy9jBa7faOV3Je0p';
const SPEI_CONFIRMATION_URL = 'https://cis.hmena.com/thanks.html?method=spei';
const ONBOARDING_CONFIRMATION_URL = 'https://cis.hmena.com/bienvenida-gracias.html';
const RESERVATION_URL = 'https://cis.hmena.com/inscripcion.html';
const ONBOARDING_URL = 'https://cis.hmena.com/bienvenida.html';
const NOTIFICATION_EMAIL = 'capinvestorschool@gmail.com';

function doPost(e) {
  const data = e && e.parameter ? e.parameter : {};
  const formType = clean(data.form_type || 'reservation').toLowerCase();
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(15000);
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);

    if (formType === 'onboarding') {
      return handleOnboarding(spreadsheet, data);
    }

    return handleReservation(spreadsheet, data);
  } catch (error) {
    console.error(error);
    const returnUrl = formType === 'onboarding' ? ONBOARDING_URL : RESERVATION_URL;
    return errorPage(returnUrl);
  } finally {
    try {
      lock.releaseLock();
    } catch (ignored) {}
  }
}

function handleReservation(spreadsheet, data) {
  requireFields(data, ['name', 'whatsapp', 'payment_preference']);
  requireYes(data, 'consent_contact_and_data');
  requireYes(data, 'accept_terms');

  const sheet = requireSheet(spreadsheet, PROSPECTS_SHEET);
  const now = new Date();
  const prospectId = Utilities.getUuid();
  const name = clean(data.name);
  const email = clean(data.email).toLowerCase();
  const whatsapp = clean(data.whatsapp);
  const paymentPreference = clean(data.payment_preference);
  const isStripe = /stripe|tarjeta/i.test(paymentPreference);
  const destination = isStripe ? STRIPE_PAYMENT_URL : SPEI_CONFIRMATION_URL;

  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    const rows = sheet.getRange(2, 1, lastRow - 1, Math.min(sheet.getLastColumn(), 18)).getDisplayValues();
    const duplicate = rows.some(function (row) {
      return clean(row[4]) === whatsapp;
    });
    if (duplicate) {
      return successPage(destination, 'Tu reserva ya estaba registrada.');
    }
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
    clean(data.form_version || '2026-07-29-v5-minimal-reservation'),
    'Sí'
  ]);

  MailApp.sendEmail({
    to: NOTIFICATION_EMAIL,
    subject: 'Nueva reserva CIS — ' + name + ' — ' + (isStripe ? 'Stripe' : 'SPEI'),
    htmlBody:
      '<p>Se inició una reserva para <strong>Aprende a Invertir desde Cero</strong>.</p>' +
      '<p><strong>Nombre:</strong> ' + escapeHtml(name) + '<br>' +
      '<strong>WhatsApp:</strong> ' + escapeHtml(whatsapp) + '<br>' +
      '<strong>Correo opcional:</strong> ' + escapeHtml(email || 'No proporcionado') + '<br>' +
      '<strong>Método:</strong> ' + escapeHtml(paymentPreference) + '</p>' +
      '<p>Revisa la pestaña Prospectos del Launch OS.</p>'
  });

  return successPage(destination, 'Tu reserva fue registrada.');
}

function handleOnboarding(spreadsheet, data) {
  requireFields(data, [
    'payment_reference',
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
    'accept_terms'
  ].forEach(function (field) {
    requireYes(data, field);
  });

  const invoiceRequired = clean(data.invoice_required);
  if (/^s[ií]/i.test(invoiceRequired)) {
    requireFields(data, ['tax_id', 'legal_name', 'cfdi_use', 'tax_address']);
  }

  const sheet = requireSheet(spreadsheet, STUDENTS_SHEET);
  const now = new Date();
  const agreementId = Utilities.getUuid();
  const paymentReference = clean(data.payment_reference);
  const name = clean(data.name);
  const email = clean(data.email).toLowerCase();
  const whatsapp = clean(data.whatsapp);

  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    const rows = sheet.getRange(2, 1, lastRow - 1, Math.min(sheet.getLastColumn(), 25)).getDisplayValues();
    const duplicate = rows.some(function (row) {
      return clean(row[3]) === paymentReference && clean(row[6]) === whatsapp;
    });
    if (duplicate) {
      return successPage(ONBOARDING_CONFIRMATION_URL, 'Tu formulario de bienvenida ya estaba registrado.');
    }
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
    clean(data.terms_version || '2026-07-29-v1'),
    'Onboarding recibido — pendiente de validación de pago',
    'Héctor',
    clean(data.notes)
  ]);

  MailApp.sendEmail({
    to: NOTIFICATION_EMAIL,
    subject: 'Formulario de bienvenida CIS — ' + name,
    htmlBody:
      '<p>Se recibió el formulario posterior al pago.</p>' +
      '<p><strong>Nombre:</strong> ' + escapeHtml(name) + '<br>' +
      '<strong>Correo LMS:</strong> ' + escapeHtml(email) + '<br>' +
      '<strong>WhatsApp:</strong> ' + escapeHtml(whatsapp) + '<br>' +
      '<strong>Referencia:</strong> ' + escapeHtml(paymentReference) + '<br>' +
      '<strong>Factura:</strong> ' + escapeHtml(invoiceRequired) + '</p>' +
      '<p>Revisa la pestaña Alumnos y acuerdos del Launch OS.</p>'
  });

  return successPage(ONBOARDING_CONFIRMATION_URL, 'Tu información fue recibida correctamente.');
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

function clean(value) {
  return String(value || '').trim();
}

function successPage(url, message) {
  return HtmlService.createHtmlOutput(
    '<!doctype html><html lang="es"><meta charset="utf-8">' +
    '<meta http-equiv="refresh" content="1;url=' + escapeHtml(url) + '">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<body style="font-family:Arial,sans-serif;padding:32px">' +
    '<h1>' + escapeHtml(message) + '</h1><p>Te estamos redirigiendo…</p>' +
    '<p><a href="' + escapeHtml(url) + '">Continuar</a></p></body></html>'
  );
}

function errorPage(returnUrl) {
  return HtmlService.createHtmlOutput(
    '<!doctype html><html lang="es"><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<body style="font-family:Arial,sans-serif;padding:32px">' +
    '<h1>No pudimos registrar la información</h1>' +
    '<p>Escríbenos por WhatsApp al +52 449 278 1853 o por correo a capinvestorschool@gmail.com.</p>' +
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
