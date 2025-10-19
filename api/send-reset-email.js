// api/send-reset-email.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { to_email, reset_link } = req.body;

  if (!to_email || !reset_link) {
    return res.status(400).json({ success: false, message: 'Missing email or reset link' });
  }

  const mailOptions = {
    from: `"eFootball League 2025" <${process.env.EMAIL_USER}>`,
    to: to_email,
    subject: 'Password Reset Request',
    html: `
      <h2>Password Reset</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${reset_link}">${reset_link}</a>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Reset email sent to ${to_email}`);
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Email send error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
