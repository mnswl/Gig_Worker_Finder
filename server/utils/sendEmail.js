const nodemailer = require('nodemailer');
let cachedTransporter = null;

async function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const useEthereal = !process.env.EMAIL_USER || process.env.EMAIL_PROVIDER === 'ethereal';
  if (useEthereal) {
    // Create a throw-away testing account
    const testAccount = await nodemailer.createTestAccount();
    console.log('[Email] Using Ethereal test SMTP. Login at https://ethereal.email/');
    console.log('[Email]  User:', testAccount.user);
    console.log('[Email]  Pass:', testAccount.pass);
    cachedTransporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  } else {
    cachedTransporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : 465,
      secure: process.env.EMAIL_SECURE === 'false' ? false : true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return cachedTransporter;
}

// Configure transporter using environment variables
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : 465,
  secure: process.env.EMAIL_SECURE === 'false' ? false : true, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send an email
 * @param {Object} opts
 * @param {string|string[]} opts.to  Recipient email(s)
 * @param {string} opts.subject      Email subject
 * @param {string} opts.html         HTML body
 * @param {string} [opts.text]       Plain-text body (optional)
 */
async function sendEmail({ to, subject, html, text }) {
  try {
    const transporter = await getTransporter();
  
    
            const fromAddress = process.env.EMAIL_FROM || `Gig Worker Finder <${(transporter.options.auth && transporter.options.auth.user) || 'no-reply@example.com'}>`;
      const info = await transporter.sendMail({
        from: fromAddress,
      to,
      subject,
      html,
      text,
    });
    if (nodemailer.getTestMessageUrl(info)) {
      console.log(`[Email] Preview: ${nodemailer.getTestMessageUrl(info)}`);
    } else {
      console.log(`Email sent to ${to}`);
    }
  } catch (err) {
    console.error('Failed to send email', err.message);
  }
}

module.exports = sendEmail;
