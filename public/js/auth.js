// auth.js - Authentication functions using Supabase Auth with Email System
import { supabase, getData, saveData } from './database.js';

const ADMIN_EMAIL = 'support@kishtechsite.online';
const EMAIL_API_URL = 'https://reset-email-system.netlify.app/.netlify/functions/send-email';

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
        
        const { error } = await supabase
            .from('password_reset_tokens')
            .insert([resetData]);
            
        if (error) throw error;
        return true;
    } catch (err) {
        console.error('Error saving reset token:', err);
        return false;
    }
}

async function validateResetToken(email, token) {
    try {
        const { data: tokenData, error } = await supabase
            .from('password_reset_tokens')
            .select('*')
            .eq('email', email)
            .eq('token', token)
            .single();

        if (error || !tokenData) return false;
        
        // Check expiration
        if (new Date() > new Date(tokenData.expires)) {
            await clearResetToken(email);
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
        const { error } = await supabase
            .from('password_reset_tokens')
            .delete()
            .eq('email', email);
            
        if (error) throw error;
        return true;
    } catch (err) {
        console.error('Error clearing reset token:', err);
        return false;
    }
}

// Clean up expired tokens
async function cleanupExpiredTokens() {
    try {
        const { error } = await supabase
            .from('password_reset_tokens')
            .delete()
            .lt('expires', new Date().toISOString());
            
        if (error) console.error('Error cleaning expired tokens:', error);
    } catch (err) {
        console.error('Token cleanup error:', err);
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
            headers: { 
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                to_email: email,
                reset_link: resetLink,
                email_type: 'reset'
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Email API response:', result);
        
        if (result.success) {
            showNotification('Password reset link has been sent to your email!', 'success');
            return true;
        } else {
            showNotification('Failed to send email: ' + (result.error || 'Unknown error'), 'error');
            return false;
        }
    } catch (err) {
        console.error('Email sending error:', err);
        showNotification('Email service temporarily unavailable. Please try again later.', 'error');
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
                email_type: 'test'
            })
        });
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const result = await response.json();
        if (result.success) {
            showNotification('Test email sent successfully!', 'success');
            return true;
        } else {
            showNotification('Failed to send test email: ' + (result.error || 'Unknown'), 'error');
            return false;
        }
    } catch (err) {
        console.error('Test email error:', err);
        showNotification('Failed to send test email: ' + err.message, 'error');
        return false;
    }
}

// ------------------------
// PASSWORD VALIDATION
// ------------------------
function validatePassword(password) {
    const minLength = 6;
    const issues = [];
    
    if (password.length < minLength) {
        issues.push(`Password must be at least ${minLength} characters`);
    }
    if (!/[A-Z]/.test(password)) {
        issues.push('Include at least one uppercase letter');
    }
    if (!/[0-9]/.test(password)) {
        issues.push('Include at least one number');
    }
    
    return {
        isValid: issues.length === 0,
        issues
    };
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
    
    try {
        setButtonLoading(submitBtn, true);

        const resetToken = generateResetToken();
        const saved = await saveResetToken(email, resetToken);
        
        if (!saved) { 
            showNotification('Failed to generate reset token. Please try again.', 'error'); 
            return false; 
        }

        const resetLink = `${window.location.origin}${window.location.pathname}?reset_token=${resetToken}&email=${encodeURIComponent(email)}`;
        const emailSent = await sendPasswordResetEmail(email, resetLink);
        
        if (emailSent) {
            // Auto-redirect back to login after successful email send
            setTimeout(showLoginForm, 3000);
        }
        return emailSent;
        
    } catch (err) {
        console.error('Password reset request failed:', err);
        showNotification('Error processing request. Please try again.', 'error');
        return false;
    } finally {
        setButtonLoading(submitBtn, false, originalText);
    }
}

export async function resetPassword(email, token, newPassword) {
    if (!await validateResetToken(email, token)) {
        showNotification('Invalid or expired reset token.', 'error');
        return false;
    }

    try {
        const hashedPassword = await hashPassword(newPassword);
        
        // Update admin config
        const { data: existingConfig, error: fetchError } = await supabase
            .from('admin_config')
            .select('*')
            .eq('email', ADMIN_EMAIL)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
            throw fetchError;
        }

        if (existingConfig) {
            const { error: updateError } = await supabase
                .from('admin_config')
                .update({ 
                    password_hash: hashedPassword, 
                    updated_at: new Date().toISOString() 
                })
                .eq('email', email);
                
            if (updateError) throw updateError;
        } else {
            const { error: insertError } = await supabase
                .from('admin_config')
                .insert([{ 
                    email: email, 
                    password_hash: hashedPassword, 
                    updated_at: new Date().toISOString() 
                }]);
                
            if (insertError) throw insertError;
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
        const { data: adminConfig, error } = await supabase
            .from('admin_config')
            .select('*')
            .eq('email', ADMIN_EMAIL)
            .single();

        if (error) throw error;
        return adminConfig?.password_hash || null;
    } catch (err) {
        console.error('Error getting admin password:', err);
        return null;
    }
}

export async function checkAdminAuth() {
    const session = sessionStorage.getItem('admin_session');
    if (!session) return false;
    
    // Check session expiration
    const sessionData = JSON.parse(session);
    if (sessionData.expires && new Date() > new Date(sessionData.expires)) {
        await logout();
        return false;
    }
    
    return true;
}

export async function setAdminAuth(authenticated) {
    if (authenticated) {
        const sessionData = {
            authenticated: true,
            timestamp: new Date().toISOString(),
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        };
        sessionStorage.setItem('admin_session', JSON.stringify(sessionData));
    } else {
        sessionStorage.removeItem('admin_session');
    }
}

export async function logout() {
    await setAdminAuth(false);
    window.location.href = 'admin.html';
}

export async function initializeAdminAuth() {
    try {
        await cleanupExpiredTokens();
        
        const { data: adminConfig, error } = await supabase
            .from('admin_config')
            .select('*')
            .eq('email', ADMIN_EMAIL)
            .single();

        console.log(adminConfig ? '✅ Admin config exists' : '❌ No admin config found');
        
        if (error && error.code !== 'PGRST116') {
            console.error('Error checking admin auth:', error);
        }
    } catch (err) {
        console.error('Error initializing admin auth:', err);
    }
}

// ------------------------
// UI HELPER FUNCTIONS
// ------------------------
function setButtonLoading(button, isLoading, originalText = null) {
    if (!button) return;
    
    if (isLoading) {
        button.dataset.originalText = originalText || button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        button.disabled = true;
    } else {
        button.innerHTML = button.dataset.originalText || originalText || 'Submit';
        button.disabled = false;
        delete button.dataset.originalText;
    }
}

function showNotification(message, type = 'info') {
    const colors = { success: '#198754', error: '#dc3545', warning: '#ffc107', info: '#0dcaf0' };
    const existing = document.getElementById('toast-temp'); 
    if (existing) existing.remove();
    
    const div = document.createElement('div');
    div.id = 'toast-temp';
    div.style.cssText = `
        position: fixed; top: 20px; right: 20px; background: #212529; color: #f8f9fa;
        border-left: 4px solid ${colors[type] || colors.info}; padding: 12px 16px; border-radius: 8px;
        box-shadow: 0 0 10px rgba(0,0,0,0.5); z-index: 2000; min-width: 250px; font-size: 14px; transition: all 0.3s ease;
    `;
    div.innerHTML = `<i class="fas fa-info-circle me-2" style="color:${colors[type]};"></i>${message}`;
    document.body.appendChild(div);
    
    setTimeout(() => { 
        div.style.opacity = '0'; 
        setTimeout(() => div.remove(), 300); 
    }, 4000);
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
// RESET TOKEN URL CHECK
// ------------------------
function checkResetTokenInURL() {
    const params = new URLSearchParams(window.location.search);
    const resetToken = params.get('reset_token');
    const email = params.get('email');
    
    if (resetToken && email) {
        showResetPasswordForm(decodeURIComponent(email), resetToken);
        // Clean URL
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
// ADMIN PAGE INIT
// ------------------------
document.addEventListener('DOMContentLoaded', async function() {
    await initializeAdminAuth();
    
    // Only run on admin pages
    if (!window.location.pathname.includes('admin.html')) return;

    checkResetTokenInURL();
    const isAuthenticated = await checkAdminAuth();

    if (isAuthenticated) {
        document.getElementById('login-section').classList.add('d-none');
        document.getElementById('admin-dashboard').classList.remove('d-none');
    }

    // Setup logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', e => {
            e.preventDefault();
            logout();
        });
    }

    // Setup login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async e => {
            e.preventDefault();
            const password = document.getElementById('admin-password').value;
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            
            setButtonLoading(submitBtn, true);
            
            try {
                const hashedPassword = await getCurrentPassword();
                if (!hashedPassword) { 
                    showNotification('Admin account not configured.', 'error'); 
                    return; 
                }
                
                if (await verifyPassword(password, hashedPassword)) {
                    await setAdminAuth(true);
                    document.getElementById('login-section').classList.add('d-none');
                    document.getElementById('admin-dashboard').classList.remove('d-none');
                    showNotification('Login successful!', 'success');
                } else {
                    showNotification('Invalid password!', 'error');
                }
            } catch (err) {
                console.error('Login error:', err);
                showNotification('Login failed. Please try again.', 'error');
            } finally {
                setButtonLoading(submitBtn, false);
            }
        });
    }

    // Setup forgot password form
    const forgotForm = document.getElementById('forgot-password-form');
    if (forgotForm) {
        forgotForm.addEventListener('submit', async e => {
            e.preventDefault();
            await requestPasswordReset(document.getElementById('forgot-email').value);
        });
    }

    // Setup reset password form
    const resetForm = document.getElementById('reset-password-form');
    if (resetForm) {
        const newPasswordInput = document.getElementById('new-password');
        if (newPasswordInput) {
            newPasswordInput.addEventListener('input', () => updatePasswordStrengthIndicator(newPasswordInput.value));
        }
        
        resetForm.addEventListener('submit', async e => {
            e.preventDefault();
            const submitBtn = resetForm.querySelector('button[type="submit"]');
            const email = document.getElementById('reset-email').value;
            const token = document.getElementById('reset-token').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            
            setButtonLoading(submitBtn, true);
            
            try {
                if (newPassword !== confirmPassword) { 
                    showNotification('Passwords do not match!', 'error'); 
                    return; 
                }
                
                const validation = validatePassword(newPassword);
                if (!validation.isValid) {
                    showNotification('Password requirements: ' + validation.issues.join(', '), 'error');
                    return;
                }
                
                if (await resetPassword(email, token, newPassword)) {
                    setTimeout(showLoginForm, 2000);
                }
            } catch (err) {
                console.error('Reset password error:', err);
                showNotification('Password reset failed.', 'error');
            } finally {
                setButtonLoading(submitBtn, false);
            }
        });
    }

    // Setup back to login links
    document.querySelectorAll('.back-to-login').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            showLoginForm();
        });
    });

    // Setup forgot password link
    const forgotLink = document.getElementById('forgot-password-link');
    if (forgotLink) {
        forgotLink.addEventListener('click', e => {
            e.preventDefault();
            showForgotPasswordForm();
        });
    }
});
