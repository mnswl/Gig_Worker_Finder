/**
 * Multi-provider SMS sender.
 * Priority:
 *   1. Infobip (free trial) if INFOBIP_API_KEY is set.
 *   2. Vonage (free trial supports Sri Lanka).
 *   3. Twilio.
 *   4. Console log fallback.
 *
 * Env vars for Infobip:
 *   INFOBIP_BASE_URL (e.g. https://your-subdomain.api.infobip.com),
 *   INFOBIP_API_KEY,
 *   INFOBIP_FROM
 * Env vars for Vonage:
 *   VONAGE_API_KEY, VONAGE_API_SECRET, VONAGE_FROM
 * Env vars for Twilio:
 *   TWILIO_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM
 */
async function sendSMS(to, body) {
  const {
    INFOBIP_BASE_URL,
    INFOBIP_API_KEY,
    INFOBIP_FROM,
    VONAGE_API_KEY,
    VONAGE_API_SECRET,
    VONAGE_FROM,
    TWILIO_SID,
    TWILIO_AUTH_TOKEN,
    TWILIO_FROM,
  } = process.env;

  // 1. Infobip
  if (INFOBIP_BASE_URL && INFOBIP_API_KEY && INFOBIP_FROM) {
    try {
      const axios = require('axios');
      await axios.post(`${INFOBIP_BASE_URL}/sms/2/text/advanced`, {
        messages: [{ from: INFOBIP_FROM, destinations: [{ to }], text: body }]
      }, {
        headers: { Authorization: `App ${INFOBIP_API_KEY}`, 'Content-Type': 'application/json' }
      });
      console.log(`SMS (Infobip) sent to ${to}`);
      return;
    } catch (err) {
      console.error('Infobip SMS failed:', err.response?.data || err.message);
      // fall through
    }
  }

  // 2. Vonage (Nexmo)
  if (VONAGE_API_KEY && VONAGE_API_SECRET && VONAGE_FROM) {
    try {
      const { Vonage } = require('@vonage/server-sdk');
      const vonage = new Vonage({ apiKey: VONAGE_API_KEY, apiSecret: VONAGE_API_SECRET });
      await vonage.sms.send({ to, from: VONAGE_FROM, text: body });
      console.log(`SMS (Vonage) sent to ${to}`);
      return;
    } catch (err) {
      console.error('Vonage SMS failed:', err.message);
      // Fall through to next provider
    }
  }

  // 2. Twilio
  if (TWILIO_SID && TWILIO_AUTH_TOKEN && TWILIO_FROM) {
    try {
      const twilio = require('twilio');
      const client = twilio(TWILIO_SID, TWILIO_AUTH_TOKEN);
      await client.messages.create({ from: TWILIO_FROM, to, body });
      console.log(`SMS (Twilio) sent to ${to}`);
      return;
    } catch (err) {
      console.error('Twilio SMS failed:', err.message);
      // Fall through to log
    }
  }

  // 3. Fallback: console log
  console.log(`Mock-sending SMS to ${to}: ${body}`);
}

module.exports = sendSMS;
