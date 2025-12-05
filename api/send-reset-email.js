// send-reset-email.js
// ✅ Uses Resend email API (works perfectly on Render, no SMTP needed)

const { Resend } = require('resend');

// Initialize with your API key from .env
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Sends a password reset email using Resend
 * @param {string} to_email - Recipient's email address
 * @param {string} reset_link - Link for resetting password
 */
module.exports = async function sendResetEmail(to_email, reset_link) {
  try {
    // Compose and send the email
    const data = await resend.emails.send({
      from: 'eFootball League <support@kishtechsite.online>',
      to: to_email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>Password Reset</h2>
          <p>Hello,</p>
          <p>You requested a password reset for your eFootball League account.</p>
          <p>Click the link below to reset your password:</p>
          <p>
            <a href="${reset_link}" 
               style="background-color:#007bff; color:#fff; padding:10px 15px; text-decoration:none; border-radius:5px;">
               Reset Password
            </a>
          </p>
          <p>If you didn’t request this, you can safely ignore this email.</p>
          <br>
          <p>⚽ eFootball League 2025 Team</p>
        </div>
      `,
    });

    console.log("✅ Reset email sent successfully:", data);
  } catch (error) {
    console.error("❌ Failed to send reset email:", error);
  }
};
