const nodemailer = require('nodemailer');

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const SMTP_HOST = process.env.SMTP_HOST || 'mail.kishtechsite.online';
const SMTP_PORT = parseInt(process.env.SMTP_PORT) || 465;

const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // true for 465, false for 587
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
    }
});

async function sendResetEmail(to_email, reset_link) {
    if (!to_email || !reset_link) throw new Error('Missing required fields');

    const mailOptions = {
        from: `"eFootball League 2025" <${EMAIL_USER}>`,
        to: to_email,
        subject: "Password Reset Request - eFootball League 2025",
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>⚽ eFootball League 2025</h2>
                <p>Hello Administrator,</p>
                <p>You requested a password reset for the admin panel.</p>
                <p><a href="${reset_link}" style="padding: 10px 20px; background:#2575fc; color:white; text-decoration:none; border-radius:5px;">Reset Password</a></p>
                <p>If the button doesn’t work, copy this link into your browser:</p>
                <p>${reset_link}</p>
                <p><strong>Important:</strong> This link expires in 1 hour.</p>
            </div>
        `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${to_email}`);
}

module.exports = sendResetEmail;
