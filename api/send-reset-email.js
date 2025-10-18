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

module.exports = async function sendResetEmail(to_email, reset_link) {
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

    await transporter.sendMail(mailOptions);
};
