// auth.js
// Authentication functions using Supabase Auth with Email System
import { supabase, getData, saveData } from './database.js';

const ADMIN_EMAIL = 'support@kishtechsite.online';
const EMAIL_API_URL = 'https://reset-email-system.netlify.app';

console.log('🔐 Auth System Loading...');

// ------------------------
// UTILITY FUNCTIONS
// ------------------------
function generateResetToken() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(password, hashedPassword) {
    const newHash = await hashPassword(password);
    return newHash === hashedPassword;
}

// ------------------------
// RESET TOKEN MANAGEMENT
// ------------------------
async function saveResetToken(email, token) {
    try {
        const resetData = {
            email,
            token,
            expires: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            created_at: new Date().toISOString()
        };
        await saveData('password_reset_tokens', [resetData]);
        return true;
    } catch (err) {
        console.error('Error saving reset token:', err);
        return false;
    }
}

async function validateResetToken(email, token) {
    try {
        const resetTokens = await getData('password_reset_tokens');
        const tokenData = resetTokens.find(t => t.email === email && t.token === token);
        if (!tokenData) return false;
        if (new Date() > new Date(tokenData.expires)) {
            await supabase.from('password_reset_tokens').delete().eq('email', email);
            return false;
        }
        return true;
    } catch (err) {
        console.error('Error validating reset token:', err);
        return false;
    }
}

async function clearResetToken(email) {
    try {
        await supabase.from('password_reset_tokens').delete().eq('email', email);
        return true;
    } catch (err) {
        console.error('Error clearing reset token:', err);
        return false;
    }
}

// ------------------------
// EMAIL FUNCTIONS
// ------------------------
async function sendPasswordResetEmail(email, resetLink) {
    try {
        console.log('🔧 Sending reset email to:', email);
        const response = await fetch(EMAIL_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to_email: email,
                reset_link: resetLink,
                email_type: 'reset',
                subject: 'Password Reset - eFootball League 2025'
            })
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        if (result.success) {
            showNotification('Password reset link has been sent!', 'success');
            return true;
        } else {
            showNotification('Failed to send email: ' + (result.message || 'Unknown'), 'error');
            return false;
        }
    } catch (err) {
        console.error('Email sending error:', err);
        showNotification('Email service temporarily unavailable.', 'error');
        return false;
    }
}

export async function sendTestEmail(email) {
    try {
        console.log('🧪 Sending test email to:', email);
        const response = await fetch(EMAIL_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to_email: email,
                email_type: 'test',
                subject: 'Test Email - eFootball League 2025'
            })
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        if (result.success) {
            showNotification('Test email sent successfully!', 'success');
            return true;
        } else {
            showNotification('Failed to send test email: ' + (result.message || 'Unknown'), 'error');
            return false;
        }
    } catch (err) {
        console.error('Test email error:', err);
        showNotification('Failed to send test email: ' + err.message, 'error');
        return false;
    }
}

// ------------------------
// PASSWORD RESET FLOW
// ------------------------
export async function requestPasswordReset(email) {
    if (!email || email !== ADMIN_EMAIL) {
        showNotification('Only the admin support email can request password resets.', 'error');
        return false;
    }

    const submitBtn = document.querySelector('#forgot-password-form button[type="submit"]');
    const originalText = submitBtn?.innerHTML || 'Send Reset Link';
    if (submitBtn) { submitBtn.innerHTML = 'Sending...'; submitBtn.disabled = true; }

    try {
        const resetToken = generateResetToken();
        const saved = await saveResetToken(email, resetToken);
        if (!saved) { showNotification('Failed to save reset token', 'error'); return false; }

        const resetLink = `${window.location.origin}${window.location.pathname}?reset_token=${resetToken}&email=${encodeURIComponent(email)}`;
        return await sendPasswordResetEmail(email, resetLink);
    } catch (err) {
        console.error('Password reset request failed:', err);
        showNotification('Error processing request.', 'error');
        return false;
    } finally {
        if (submitBtn) { submitBtn.innerHTML = originalText; submitBtn.disabled = false; }
    }
}

export async function resetPassword(email, token, newPassword) {
    if (!await validateResetToken(email, token)) {
        showNotification('Invalid or expired reset token.', 'error');
        return false;
    }

    try {
        const hashedPassword = await hashPassword(newPassword);
        const adminConfig = { email, password_hash: hashedPassword, updated_at: new Date().toISOString() };
        const existingConfig = await getData('admin_config');
        const config = existingConfig.find(c => c.email === ADMIN_EMAIL);

        if (config) {
            await supabase.from('admin_config').update(adminConfig).eq('email', email);
        } else {
            await saveData('admin_config', [adminConfig]);
        }

        await clearResetToken(email);
        showNotification('Password reset successfully!', 'success');
        return true;
    } catch (err) {
        console.error('Error resetting password:', err);
        showNotification('Password reset failed.', 'error');
        return false;
    }
}

// ------------------------
// ADMIN AUTH FUNCTIONS
// ------------------------
export async function getCurrentPassword() {
    try {
        const adminConfig = await getData('admin_config');
        const config = adminConfig.find(c => c.email === ADMIN_EMAIL);
        return config?.password_hash || null;
    } catch (err) {
        console.error('Error getting admin password:', err);
        return null;
    }
}

export async function checkAdminAuth() {
    return sessionStorage.getItem('admin_session') === 'true';
}

export async function setAdminAuth(authenticated) {
    if (authenticated) sessionStorage.setItem('admin_session', 'true');
    else sessionStorage.removeItem('admin_session');
}

export async function logout() {
    await setAdminAuth(false);
    window.location.href = 'admin.html';
}

export async function initializeAdminAuth() {
    try {
        const adminConfig = await getData('admin_config');
        const config = adminConfig.find(c => c.email === ADMIN_EMAIL);
        console.log(config ? '✅ Admin config exists' : '❌ No admin config found');
    } catch (err) {
        console.error('Error checking admin auth:', err);
    }
}

// ------------------------
// UI FUNCTIONS
// ------------------------
function showNotification(message, type = 'info') {
    const colors = { success: '#198754', error: '#dc3545', warning: '#ffc107', info: '#0dcaf0' };
    const existing = document.getElementById('toast-temp'); if (existing) existing.remove();
    const div = document.createElement('div');
    div.id = 'toast-temp';
    div.style.cssText = `
        position: fixed; top: 20px; right: 20px; background: #212529; color: #f8f9fa;
        border-left: 4px solid ${colors[type] || colors.info}; padding: 12px 16px; border-radius: 8px;
        box-shadow: 0 0 10px rgba(0,0,0,0.5); z-index: 2000; min-width: 250px; font-size: 14px; transition: all 0.3s ease;
    `;
    div.innerHTML = `<i class="fas fa-info-circle me-2" style="color:${colors[type]};"></i>${message}`;
    document.body.appendChild(div);
    setTimeout(() => { div.style.opacity = '0'; setTimeout(() => div.remove(), 300); }, 4000);
}

// ------------------------
// RESET TOKEN URL CHECK
// ------------------------
function checkResetTokenInURL() {
    const params = new URLSearchParams(window.location.search);
    const resetToken = params.get('reset_token');
    const email = params.get('email');
    if (resetToken && email) {
        showResetPasswordForm(decodeURIComponent(email), resetToken);
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
    }
}

function showResetPasswordForm(email, token) {
    const loginSection = document.getElementById('login-section');
    const resetSection = document.getElementById('reset-password-section');
    if (loginSection && resetSection) {
        loginSection.classList.add('d-none');
        resetSection.classList.remove('d-none');
        document.getElementById('reset-email').value = email;
        document.getElementById('reset-token').value = token;
    }
}

function showForgotPasswordForm() {
    const loginSection = document.getElementById('login-section');
    const forgotSection = document.getElementById('forgot-password-section');
    if (loginSection && forgotSection) {
        loginSection.classList.add('d-none');
        forgotSection.classList.remove('d-none');
        document.getElementById('forgot-email').value = ADMIN_EMAIL;
    }
}

function showLoginForm() {
    const loginSection = document.getElementById('login-section');
    const forgotSection = document.getElementById('forgot-password-section');
    const resetSection = document.getElementById('reset-password-section');
    if (loginSection) loginSection.classList.remove('d-none');
    if (forgotSection) forgotSection.classList.add('d-none');
    if (resetSection) resetSection.classList.add('d-none');
}

// ------------------------
// PASSWORD STRENGTH CHECK
// ------------------------
function checkPasswordStrength(password) {
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
}

function updatePasswordStrengthIndicator(password) {
    const strengthBar = document.getElementById('password-strength-bar');
    const strengthText = document.getElementById('password-strength-text');
    if (!strengthBar || !strengthText) return;

    const strength = checkPasswordStrength(password);
    strengthBar.className = 'password-strength';
    strengthText.className = 'small mt-1';

    if (password.length === 0) {
        strengthBar.style.width = '0%';
        strengthBar.style.backgroundColor = 'transparent';
        strengthText.textContent = '';
        return;
    }

    const widthPercent = Math.min((strength / 5) * 100, 100);
    strengthBar.style.width = widthPercent + '%';

    if (strength < 2) {
        strengthBar.style.backgroundColor = '#dc3545';
        strengthText.textContent = 'Weak';
        strengthText.style.color = '#dc3545';
    } else if (strength < 4) {
        strengthBar.style.backgroundColor = '#ffc107';
        strengthText.textContent = 'Medium';
        strengthText.style.color = '#ffc107';
    } else {
        strengthBar.style.backgroundColor = '#28a745';
        strengthText.textContent = 'Strong';
        strengthText.style.color = '#28a745';
    }
}

// ------------------------
// ADMIN PAGE INIT
// ------------------------
document.addEventListener('DOMContentLoaded', async function() {
    await initializeAdminAuth();
    if (!window.location.pathname.includes('admin.html')) return;

    checkResetTokenInURL();
    const isAuthenticated = await checkAdminAuth();

    if (isAuthenticated) {
        document.getElementById('login-section').classList.add('d-none');
        document.getElementById('admin-dashboard').classList.remove('d-none');
    }

    // Setup logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', e => { e.preventDefault(); logout(); });

    // Setup login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async e => {
            e.preventDefault();
            const password = document.getElementById('admin-password').value;
            const hashedPassword = await getCurrentPassword();
            if (!hashedPassword) { showNotification('Admin account not configured.', 'error'); return; }
            if (await verifyPassword(password, hashedPassword)) {
                await setAdminAuth(true);
                document.getElementById('login-section').classList.add('d-none');
                document.getElementById('admin-dashboard').classList.remove('d-none');
                showNotification('Login successful!', 'success');
            } else showNotification('Invalid password!', 'error');
        });
    }

    // Setup forgot password
    const forgotForm = document.getElementById('forgot-password-form');
    if (forgotForm) forgotForm.addEventListener('submit', e => {
        e.preventDefault();
        requestPasswordReset(document.getElementById('forgot-email').value);
    });

    // Setup reset password
    const resetForm = document.getElementById('reset-password-form');
    if (resetForm) {
        const newPasswordInput = document.getElementById('new-password');
        if (newPasswordInput) newPasswordInput.addEventListener('input', () => updatePasswordStrengthIndicator(newPasswordInput.value));
        resetForm.addEventListener('submit', async e => {
            e.preventDefault();
            const email = document.getElementById('reset-email').value;
            const token = document.getElementById('reset-token').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            if (newPassword !== confirmPassword) { showNotification('Passwords do not match!', 'error'); return; }
            if (newPassword.length < 6) { showNotification('Password too short!', 'error'); return; }
            if (await resetPassword(email, token, newPassword)) setTimeout(showLoginForm, 2000);
        });
    }

    // Setup back to login links
    document.querySelectorAll('.back-to-login').forEach(link => link.addEventListener('click', e => { e.preventDefault(); showLoginForm(); }));

    // Setup forgot password link
    const forgotLink = document.getElementById('forgot-password-link');
    if (forgotLink) forgotLink.addEventListener('click', e => { e.preventDefault(); showForgotPasswordForm(); });
});
