require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const EMAIL_USER = process.env.EMAIL_USER; // your Gmail address
const EMAIL_PASS = process.env.EMAIL_PASS; // app password
const TARGET_EMAIL = process.env.TARGET_EMAIL || EMAIL_USER; // recipient

if (!EMAIL_USER || !EMAIL_PASS) {
  console.warn('Warning: EMAIL_USER or EMAIL_PASS not set. Server will reject requests until configured.');
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

app.post('/send-email', async (req, res) => {
  const { name, email, message } = req.body || {};
  if (!message) return res.status(400).json({ success: false, error: 'Message is required' });
  if (!EMAIL_USER || !EMAIL_PASS) return res.status(500).json({ success: false, error: 'Server email not configured' });

  const mailOptions = {
    from: `${name || 'Website Visitor'} <${email || EMAIL_USER}>`,
    to: TARGET_EMAIL,
    subject: `Website message from ${name || 'Visitor'}`,
    text: `Name: ${name || 'N/A'}\nEmail: ${email || 'N/A'}\n\n${message}`,
    html: `<p><strong>Name:</strong> ${name || 'N/A'}</p><p><strong>Email:</strong> ${email || 'N/A'}</p><p>${(message||'')}</p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    return res.json({ success: true });
  } catch (err) {
    console.error('Mail send error:', err);
    return res.status(500).json({ success: false, error: 'Failed to send email' });
  }
});

app.listen(PORT, () => console.log(`Email server listening on http://localhost:${PORT}`));
