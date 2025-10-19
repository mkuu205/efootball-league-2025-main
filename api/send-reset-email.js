const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Your Gmail address
        pass: process.env.EMAIL_PASS  // Your Gmail App Password
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
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>Password Reset</h2>
                <p>Hello,</p>
                <p>Click the button below to reset your password:</p>
                <p>
                    <a href="${reset_link}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
                </p>
                <p>If the button doesn't work, copy and paste this link into your browser:</p>
                <p><a href="${reset_link}">${reset_link}</a></p>
                <p>⚽ eFootball League 2025 Team</p>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent:', info.response);
        return { success: true, message: 'Reset email sent successfully.' };
    } catch (error) {
        console.error('❌ Error sending email:', error);
        return { success: false, message: error.message };
    }
};
