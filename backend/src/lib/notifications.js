const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const WHATSAPP_RECIPIENT = process.env.WHATSAPP_RECIPIENT;

function buildSaleMessage({ cliente, nombreComponente, cantidad, total, estado }) {
  const estadoTexto =
    estado === 'confirmada'
      ? '? Pago confirmado � en espera de entrega'
      : '?? Nueva solicitud de compra';

  return [
    '?? *Nueva compra registrada*',
    '',
    `?? Cliente: ${cliente}`,
    `?? Producto: ${nombreComponente}`,
    `?? Cantidad: ${cantidad}`,
    `?? Total: S/ ${Number(total || 0).toFixed(2)}`,
    `?? Estado: ${estadoTexto}`,
  ].join('\n');
}

async function sendTelegramMessage(text) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    return { ok: false, reason: 'telegram_not_configured' };
  }

  const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text,
      parse_mode: 'Markdown',
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { ok: false, reason: data.description || 'telegram_request_failed' };
  }

  return { ok: true, provider: 'telegram' };
}

async function sendWhatsAppMessage(text) {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID || !WHATSAPP_RECIPIENT) {
    return { ok: false, reason: 'whatsapp_not_configured' };
  }

  const response = await fetch(`https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_ID}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: WHATSAPP_RECIPIENT,
      type: 'text',
      text: { body: text },
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { ok: false, reason: data.error?.message || 'whatsapp_request_failed' };
  }

  return { ok: true, provider: 'whatsapp' };
}

async function notifySaleConfirmation(payload) {
  const text = buildSaleMessage(payload);
  const telegramResult = await sendTelegramMessage(text);
  if (telegramResult.ok) {
    return telegramResult;
  }

  const whatsappResult = await sendWhatsAppMessage(text);
  if (whatsappResult.ok) {
    return whatsappResult;
  }

  return {
    ok: false,
    reason: 'no_notification_provider_configured',
    details: {
      telegram: telegramResult,
      whatsapp: whatsappResult,
    },
  };
}

module.exports = {
  notifySaleConfirmation,
};
