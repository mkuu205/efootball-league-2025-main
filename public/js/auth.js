// Authentication functions using Supabase Auth with Email System
import { supabase, getData, saveData } from './database.js';

const ADMIN_EMAIL = 'support@kishtechsite.online';
const EMAIL_API_URL = 'https://reset-email-system.netlify.app/.netlify/functions/send-email';

// Debug current authentication state
console.log('🔐 Auth System Loading...');

// Password reset functionality
function generateResetToken() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

async function saveResetToken(email, token) {
    try {
        const resetData = {
            email: email,
            token: token,
            expires: new Date(Date.now() + (60 * 60 * 1000)).toISOString(), // 1 hour expiry
            created_at: new Date().toISOString()
        };
        
        // Use password_reset_tokens table
        await saveData('password_reset_tokens', [resetData]);
        return true;
    } catch (error) {
        console.error('Error saving reset token:', error);
        return false;
    }
}

async function validateResetToken(email, token) {
    try {
        const resetTokens = await getData('password_reset_tokens');
        const tokenData = resetTokens.find(t => t.email === email && t.token === token);
        
        if (!tokenData) {
            return false;
        }
        
        if (new Date() > new Date(tokenData.expires)) {
            // Token expired, delete it
            await supabase.from('password_reset_tokens').delete().eq('email', email);
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Error validating reset token:', error);
        return false;
    }
}

async function clearResetToken(email) {
    try {
        await supabase.from('password_reset_tokens').delete().eq('email', email);
        return true;
    } catch (error) {
        console.error('Error clearing reset token:', error);
        return false;
    }
}

// Real email sending function using your Netlify function
async function sendPasswordResetEmail(email, resetLink) {
    try {
        console.log('🔧 Sending reset email to:', email);
        console.log('📧 Using email API:', EMAIL_API_URL);

        const response = await fetch(EMAIL_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                to_email: email,
                reset_link: resetLink,
                email_type: 'reset',
                subject: 'Password Reset - eFootball League 2025'
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('📧 Email API response:', result);

        if (result.success) {
            console.log('✅ Email sent successfully');
            showNotification('Password reset link has been sent to your email!', 'success');
            return true;
        } else {
            console.error('❌ Email sending failed:', result.message);
            showNotification('Failed to send email: ' + (result.message || 'Unknown error'), 'error');
            return false;
        }

    } catch (error) {
        console.error('❌ Email sending error:', error);
        showNotification('Email service temporarily unavailable. Please try again later.', 'error');
        return false;
    }
}

// Test email functionality
export async function sendTestEmail(email) {
    try {
        console.log('🧪 Sending test email to:', email);

        const response = await fetch(EMAIL_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                to_email: email,
                email_type: 'test',
                subject: 'Test Email - eFootball League 2025'
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('📧 Test email response:', result);

        if (result.success) {
            console.log('✅ Test email sent successfully');
            showNotification('Test email sent successfully!', 'success');
            return true;
        } else {
            console.error('❌ Test email failed:', result.message);
            showNotification('Failed to send test email: ' + (result.message || 'Unknown error'), 'error');
            return false;
        }

    } catch (error) {
        console.error('Test email error:', error);
        showNotification('Failed to send test email: ' + error.message, 'error');
        return false;
    }
}

async function requestPasswordReset(email) {
    // Validate email - only allow the specific support email
    if (!email || email !== ADMIN_EMAIL) {
        showNotification('Only the admin support email (support@kishtechsite.online) can request password resets.', 'error');
        return false;
    }
    
    // Show loading state
    const submitBtn = document.querySelector('#forgot-password-form button[type="submit"]');
    const originalText = submitBtn?.innerHTML || 'Send Reset Link';
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Sending...';
        submitBtn.disabled = true;
    }
    
    try {
        // Generate reset token
        const resetToken = generateResetToken();
        const saved = await saveResetToken(email, resetToken);
        
        if (!saved) {
            showNotification('Failed to save reset token', 'error');
            return false;
        }
        
        // Create reset link
        const resetLink = `${window.location.origin}${window.location.pathname}?reset_token=${resetToken}&email=${encodeURIComponent(email)}`;
        
        console.log('🔄 Sending reset email with link:', resetLink);
        
        // Send email
        let emailSent = await sendPasswordResetEmail(email, resetLink);
        
        if (emailSent) {
            return true;
        } else {
            showNotification('Failed to send email. Please try again or contact support.', 'error');
            return false;
        }
        
    } catch (error) {
        console.error('Password reset request failed:', error);
        showNotification('An error occurred while processing your request. Please try again.', 'error');
        return false;
    } finally {
        // Restore button state
        if (submitBtn) {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }
}

async function resetPassword(email, token, newPassword) {
    // Validate token
    if (!await validateResetToken(email, token)) {
        showNotification('Invalid or expired reset token.', 'error');
        return false;
    }
    
    // Update password in Supabase
    try {
        const hashedPassword = await hashPassword(newPassword);
        const adminConfig = {
            email: email,
            password_hash: hashedPassword,
            updated_at: new Date().toISOString()
        };
        
        // Check if admin config exists
        const existingConfig = await getData('admin_config');
        const config = existingConfig.find(c => c.email === ADMIN_EMAIL);
        
        if (config) {
            // Update existing config
            await supabase.from('admin_config').update(adminConfig).eq('email', email);
        } else {
            // Create new config
            await saveData('admin_config', [adminConfig]);
        }
        
        await clearResetToken(email);
        showNotification('Password reset successfully! You can now login with your new password.', 'success');
        return true;
    } catch (error) {
        console.error('Error resetting password:', error);
        showNotification('Password reset failed.', 'error');
        return false;
    }
}

// Password hash function using Web Crypto API
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

async function getCurrentPassword() {
    try {
        const adminConfig = await getData('admin_config');
        const config = adminConfig.find(c => c.email === ADMIN_EMAIL);
        
        if (!config) {
            console.log('❌ No admin config found in database');
            return null;
        }
        
        console.log('✅ Found admin config with password hash');
        return config.password_hash;
    } catch (error) {
        console.error('Error getting admin password:', error);
        return null;
    }
}

export async function checkAdminAuth() {
    try {
        // Use sessionStorage as auth check
        const isAuthenticated = sessionStorage.getItem('admin_session') === 'true';
        console.log('🔐 Session auth check:', isAuthenticated);
        return isAuthenticated;
        
    } catch (error) {
        console.error('Error checking admin auth:', error);
        return false;
    }
}

export async function setAdminAuth(authenticated) {
    try {
        if (authenticated) {
            sessionStorage.setItem('admin_session', 'true');
            console.log('🔐 Admin auth set to: true');
        } else {
            sessionStorage.removeItem('admin_session');
            console.log('🔐 Admin auth set to: false');
        }
        return true;
    } catch (error) {
        console.error('Error setting admin auth:', error);
        return false;
    }
}

export async function logout() {
    console.log('🔐 Logging out admin');
    await setAdminAuth(false);
    window.location.href = 'admin.html';
}

// Initialize admin auth - check if config exists
export async function initializeAdminAuth() {
    try {
        const adminConfig = await getData('admin_config');
        const config = adminConfig.find(c => c.email === ADMIN_EMAIL);
        
        if (config) {
            console.log('✅ Admin config found in database');
            console.log('📧 Admin email:', config.email);
            console.log('🔑 Password hash exists:', !!config.password_hash);
        } else {
            console.log('❌ No admin config found. Please set up admin password.');
        }
    } catch (error) {
        console.error('Error checking admin auth:', error);
    }
}

// Check for reset token in URL
function checkResetTokenInURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get('reset_token');
    const email = urlParams.get('email');
    
    if (resetToken && email) {
        console.log('🔄 Reset token detected in URL');
        // Show reset password form
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
        
        // Set email and token in form
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
        
        // Pre-fill the email field
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

// Password strength indicator
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
    
    // Reset classes
    strengthBar.className = 'password-strength';
    strengthText.className = 'small mt-1';
    
    if (password.length === 0) {
        strengthBar.style.width = '0%';
        strengthBar.style.backgroundColor = 'transparent';
        strengthText.textContent = '';
        return;
    }
    
    // Set width based on strength
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

// Add test email button to admin panel
function addTestEmailButton() {
    const notificationsTab = document.getElementById('admin-notifications');
    if (notificationsTab) {
        const testButton = document.createElement('button');
        testButton.className = 'btn btn-outline-info btn-sm ms-2';
        testButton.innerHTML = '<i class="fas fa-envelope me-1"></i> Test Email';
        testButton.onclick = () => sendTestEmail(ADMIN_EMAIL);
        
        const header = notificationsTab.querySelector('.card-header');
        if (header) {
            header.appendChild(testButton);
        }
    }
}

// Notification function
function showNotification(message, type = 'info') {
    const colors = {
        success: '#198754',
        error: '#dc3545',
        warning: '#ffc107',
        info: '#0dcaf0'
    };

    const existing = document.getElementById('toast-temp');
    if (existing) existing.remove();

    const div = document.createElement('div');
    div.id = 'toast-temp';
    div.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #212529;
        color: #f8f9fa;
        border-left: 4px solid ${colors[type] || colors.info};
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 0 10px rgba(0,0,0,0.5);
        z-index: 2000;
        min-width: 250px;
        font-size: 14px;
        transition: all 0.3s ease;
        opacity: 1;
    `;
    div.innerHTML = `<i class="fas fa-info-circle me-2" style="color:${colors[type]};"></i>${message}`;

    document.body.appendChild(div);

    setTimeout(() => {
        div.style.opacity = '0';
        div.style.transform = 'translateY(-10px)';
        setTimeout(() => div.remove(), 300);
    }, 4000);
}

// Auto-redirect if already authenticated on admin page
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🔐 Admin page loaded');
    
    // Initialize admin auth system
    await initializeAdminAuth();
    
    if (window.location.pathname.includes('admin.html')) {
        // Check for reset token in URL first
        checkResetTokenInURL();
        
        const isAuthenticated = await checkAdminAuth();
        console.log('🔐 Initial auth check:', isAuthenticated);
        
        if (isAuthenticated) {
            document.getElementById('login-section').classList.add('d-none');
            document.getElementById('admin-dashboard').classList.remove('d-none');
            console.log('🔐 Auto-redirected to dashboard');
            
            // Add test email button to notifications tab
            addTestEmailButton();
        }
        
        // Setup logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('🔐 Logout button clicked');
                logout();
            });
        }
        
        // Setup login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                const password = document.getElementById('admin-password').value;
                const hashedPassword = await getCurrentPassword();
                
                console.log('🔐 Login attempt');
                console.log('🔑 Input password length:', password.length);
                console.log('🔑 Stored hash exists:', !!hashedPassword);
                
                if (!hashedPassword) {
                    showNotification('Admin account not configured. Please contact administrator.', 'error');
                    return;
                }
                
                if (await verifyPassword(password, hashedPassword)) {
                    await setAdminAuth(true);
                    document.getElementById('login-section').classList.add('d-none');
                    document.getElementById('admin-dashboard').classList.remove('d-none');
                    showNotification('Login successful!', 'success');
                    console.log('🔐 Login successful');
                    
                    // Add test email button after login
                    addTestEmailButton();
                } else {
                    showNotification('Invalid password!', 'error');
                    console.log('🔐 Login failed - password mismatch');
                }
            });
        }
        
        // Setup forgot password form
        const forgotForm = document.getElementById('forgot-password-form');
        if (forgotForm) {
            forgotForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const email = document.getElementById('forgot-email').value;
                console.log('🔐 Forgot password request for:', email);
                requestPasswordReset(email);
            });
        }
        
        // Setup reset password form
        const resetForm = document.getElementById('reset-password-form');
        if (resetForm) {
            // Password strength indicator
            const newPasswordInput = document.getElementById('new-password');
            if (newPasswordInput) {
                newPasswordInput.addEventListener('input', function() {
                    updatePasswordStrengthIndicator(this.value);
                });
            }
            
            resetForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                const email = document.getElementById('reset-email').value;
                const token = document.getElementById('reset-token').value;
                const newPassword = document.getElementById('new-password').value;
                const confirmPassword = document.getElementById('confirm-password').value;
                
                if (newPassword !== confirmPassword) {
                    showNotification('Passwords do not match!', 'error');
                    return;
                }
                
                if (newPassword.length < 6) {
                    showNotification('Password must be at least 6 characters long!', 'error');
                    return;
                }
                
                if (await resetPassword(email, token, newPassword)) {
                    // Redirect to login after successful reset
                    setTimeout(() => {
                        showLoginForm();
                    }, 2000);
                }
            });
        }
        
        // Setup back to login links
        const backToLoginLinks = document.querySelectorAll('.back-to-login');
        backToLoginLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('🔐 Back to login clicked');
                showLoginForm();
            });
        });
        
        // Setup forgot password link
        const forgotPasswordLink = document.getElementById('forgot-password-link');
        if (forgotPasswordLink) {
            forgotPasswordLink.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('🔐 Forgot password link clicked');
                showForgotPasswordForm();
            });
        }
    }
});
