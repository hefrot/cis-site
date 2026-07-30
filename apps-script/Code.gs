const PROSPECTS_SHEET = 'Prospectos';

function doPost(e) {
  try {
    const props = PropertiesService.getScriptProperties();
    const spreadsheetId = props.getProperty('CIS_SPREADSHEET_ID');
    const confirmationUrl = props.getProperty('CIS_CONFIRMATION_URL') || 'https://cis.hmena.com/thanks.html';

    if (!spreadsheetId) {
      throw new Error('Missing CIS_SPREADSHEET_ID script property');
    }

    const data = e && e.parameter ? e.parameter : {};
    const required = ['name', 'email', 'whatsapp', 'country_city', 'experience', 'interest', 'referral_source', 'payment_preference', 'invoice_required'];
    required.forEach((field) => {
      if (!String(data[field] || '').trim()) throw new Error(`Missing required field: ${field}`);
    });

    if (String(data.consent_contact_and_data || '') !== 'yes') {
      throw new Error('Consent is required');
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(15000);

    try {
      const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
      const sheet = spreadsheet.getSheetByName(PROSPECTS_SHEET);
      if (!sheet) throw new Error(`Sheet not found: ${PROSPECTS_SHEET}`);

      const now = new Date();
      const prospectId = Utilities.getUuid();
      const email = String(data.email).trim().toLowerCase();
      const whatsapp = String(data.whatsapp).trim();

      // Prevent rapid duplicate submissions using email + WhatsApp.
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        const rows = sheet.getRange(2, 1, lastRow - 1, Math.min(sheet.getLastColumn(), 15)).getDisplayValues();
        const duplicate = rows.some((row) => row.includes(email) && row.includes(whatsapp));
        if (duplicate) return successPage(confirmationUrl, 'Tu solicitud ya estaba registrada.');
      }

      sheet.appendRow([
        now,
        prospectId,
        String(data.name).trim(),
        email,
        whatsapp,
        String(data.country_city).trim(),
        String(data.referral_source).trim(),
        String(data.interest).trim(),
        String(data.experience).trim(),
        String(data.payment_preference).trim(),
        String(data.invoice_required).trim(),
        'Nuevo',
        'Fernando',
        'Contacto inicial dentro de 24 horas',
        String(data.learning_goal || '').trim(),
        String(data.source_page || '').trim(),
        String(data.form_version || '').trim(),
        'yes'
      ]);

      MailApp.sendEmail({
        to: 'capinvestorschool@gmail.com',
        subject: `Nuevo prospecto CIS — ${String(data.name).trim()}`,
        htmlBody: `<p>Se registró un nuevo prospecto para <strong>Aprende a Invertir desde Cero</strong>.</p><p><strong>Nombre:</strong> ${escapeHtml(data.name)}<br><strong>Correo:</strong> ${escapeHtml(email)}<br><strong>WhatsApp:</strong> ${escapeHtml(whatsapp)}<br><strong>Método:</strong> ${escapeHtml(data.payment_preference)}</p><p>Revisa la pestaña Prospectos del Launch OS.</p>`
      });

      return successPage(confirmationUrl, 'Tu solicitud fue registrada correctamente.');
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    console.error(error);
    return HtmlService.createHtmlOutput(`<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font-family:Arial,sans-serif;padding:32px"><h1>No pudimos registrar tu solicitud</h1><p>Escríbenos por WhatsApp al +52 449 278 1853 o por correo a capinvestorschool@gmail.com.</p><p><a href="https://cis.hmena.com/register.html">Volver al registro</a></p></body></html>`);
  }
}

function successPage(url, message) {
  return HtmlService.createHtmlOutput(`<!doctype html><html lang="es"><meta charset="utf-8"><meta http-equiv="refresh" content="1;url=${url}"><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font-family:Arial,sans-serif;padding:32px"><h1>${escapeHtml(message)}</h1><p>Te estamos redirigiendo…</p><p><a href="${url}">Continuar</a></p></body></html>`);
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
