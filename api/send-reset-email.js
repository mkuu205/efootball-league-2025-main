import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { to_email, reset_link } = req.body;

  if (!to_email || !reset_link) {
    return res.status(400).json({ success: false, message: 'Missing parameters' });
  }

  try {
    // Create transporter using environment variables
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_PORT === '465', // true for 465, false for others
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: to_email,
      subject: 'eFootball League 2025 – Reset Your Password',
      html: `
        <p>Hello,</p>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <p><a href="${reset_link}">Reset Password</a></p>
        <p>If you didn’t request this, ignore this email.</p>
      `
    });

    return res.status(200).json({ success: true, message: 'Password reset email sent' });

  } catch (error) {
    console.error('Send email error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
