// Placeholder email service – integrate with SendGrid/Mailgun later
const config = require('../config');

async function sendEmail({ to, subject, body }) {
  if (!config.email?.apiKey) {
    console.log(`Email placeholder: To ${to}, Subject "${subject}"`);
    return;
  }
  // TODO: actual email sending logic
  throw new Error('Email service not implemented');
}

module.exports = { sendEmail };
