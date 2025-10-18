// Authentication functions with real email integration
const ADMIN_PASSWORD = 'Brashokish2425';
const ADMIN_EMAIL = 'support@kishtechsite.online'; // Your support email

// Password reset functionality
function generateResetToken() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function saveResetToken(email, token) {
    const resetTokens = JSON.parse(localStorage.getItem('efl_reset_tokens') || '{}');
    resetTokens[email] = {
        token: token,
        expires: Date.now() + (60 * 60 * 1000) // 1 hour expiry
    };
    localStorage.setItem('efl_reset_tokens', JSON.stringify(resetTokens));
}

function validateResetToken(email, token) {
    const resetTokens = JSON.parse(localStorage.getItem('efl_reset_tokens') || '{}');
    const tokenData = resetTokens[email];
    
    if (!tokenData || tokenData.token !== token) {
        return false;
    }
    
    if (Date.now() > tokenData.expires) {
        delete resetTokens[email];
        localStorage.setItem('efl_reset_tokens', JSON.stringify(resetTokens));
        return false;
    }
    
    return true;
}

function clearResetToken(email) {
    const resetTokens = JSON.parse(localStorage.getItem('efl_reset_tokens') || '{}');
    delete resetTokens[email];
    localStorage.setItem('efl_reset_tokens', JSON.stringify(resetTokens));
}

// Real email sending function using PHP backend
async function sendPasswordResetEmail(email, resetLink) {
    try {
        console.log('🔧 Attempting to send reset email to:', email);
        
        const response = await fetch('php/send-reset-email.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                to_email: email,
                reset_link: resetLink
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('📧 Email send result:', result);
        
        if (result.success) {
            console.log('✅ Password reset email sent successfully');
            return true;
        } else {
            console.error('❌ Failed to send email:', result.message);
            // Fallback: Show the reset link for manual copying
            showNotification(`Email service temporarily unavailable. Please copy this reset link manually: ${resetLink}`, 'warning');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Email sending error:', error);
        
        // Fallback: Show the reset link for manual copying
        const fallbackMessage = `Email service temporarily unavailable. Please copy this reset link manually: ${resetLink}`;
        showNotification(fallbackMessage, 'warning');
        
        // Also log to console for debugging
        console.log('🔗 Manual reset link:', resetLink);
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
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Sending...';
    submitBtn.disabled = true;
    
    try {
        // Generate reset token
        const resetToken = generateResetToken();
        saveResetToken(email, resetToken);
        
        // Create reset link
        const resetLink = `${window.location.origin}${window.location.pathname}?reset_token=${resetToken}&email=${encodeURIComponent(email)}`;
        
        console.log('🔄 Sending reset email with link:', resetLink);
        
        // Send email using PHP backend
        let emailSent = await sendPasswordResetEmail(email, resetLink);
        
        if (emailSent) {
            showNotification('Password reset link has been sent to support@kishtechsite.online!', 'success');
            return true;
        } else {
            showNotification('Failed to send reset email. Please try again or contact support.', 'error');
            return false;
        }
        
    } catch (error) {
        console.error('Password reset request failed:', error);
        showNotification('An error occurred while sending the reset email. Please try again.', 'error');
        return false;
    } finally {
        // Restore button state
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

function resetPassword(email, token, newPassword) {
    // Validate token
    if (!validateResetToken(email, token)) {
        showNotification('Invalid or expired reset token.', 'error');
        return false;
    }
    
    // Update password
    if (email === ADMIN_EMAIL) {
        localStorage.setItem('efl_admin_password', newPassword);
        clearResetToken(email);
        showNotification('Password reset successfully! You can now login with your new password.', 'success');
        return true;
    }
    
    showNotification('Password reset failed.', 'error');
    return false;
}

function getCurrentPassword() {
    return localStorage.getItem('efl_admin_password') || ADMIN_PASSWORD;
}

function checkAdminAuth() {
    return localStorage.getItem(DB_KEYS.ADMIN_AUTH) === 'true';
}

function setAdminAuth(authenticated) {
    localStorage.setItem(DB_KEYS.ADMIN_AUTH, authenticated.toString());
}

function logout() {
    setAdminAuth(false);
    window.location.href = 'admin.html';
}

// Check for reset token in URL
function checkResetTokenInURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get('reset_token');
    const email = urlParams.get('email');
    
    if (resetToken && email) {
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

// Auto-redirect if already authenticated on admin page
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('admin.html')) {
        // Check for reset token in URL first
        checkResetTokenInURL();
        
        if (checkAdminAuth()) {
            document.getElementById('login-section').classList.add('d-none');
            document.getElementById('admin-dashboard').classList.remove('d-none');
        }
        
        // Setup logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', logout);
        }
        
        // Setup login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const password = document.getElementById('admin-password').value;
                const currentPassword = getCurrentPassword();
                
                if (password === currentPassword) {
                    setAdminAuth(true);
                    document.getElementById('login-section').classList.add('d-none');
                    document.getElementById('admin-dashboard').classList.remove('d-none');
                    showNotification('Login successful!', 'success');
                } else {
                    showNotification('Invalid password!', 'error');
                }
            });
        }
        
        // Setup forgot password form
        const forgotForm = document.getElementById('forgot-password-form');
        if (forgotForm) {
            forgotForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const email = document.getElementById('forgot-email').value;
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
            
            resetForm.addEventListener('submit', function(e) {
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
                
                if (resetPassword(email, token, newPassword)) {
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
                showLoginForm();
            });
        });
        
        // Setup forgot password link
        const forgotPasswordLink = document.getElementById('forgot-password-link');
        if (forgotPasswordLink) {
            forgotPasswordLink.addEventListener('click', function(e) {
                e.preventDefault();
                showForgotPasswordForm();
            });
        }
    }
});
