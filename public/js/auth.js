// auth.js - Fixed Authentication System
import { 
    getData, 
    saveData, 
    DB_KEYS, 
    showNotification,
    getSupabase,
    ensureSupabaseInitialized,
    getCurrentPassword,
    updateAdminPassword
} from './database.js';

// Get the supabase client instance
const supabase = getSupabase();

// Admin authentication state
let adminAuthenticated = false;
const ADMIN_EMAIL = 'support@kishtechsite.online';

// Password reset tokens management
async function cleanupExpiredTokens() {
    try {
        // Wait for Supabase to be initialized
        if (!await ensureSupabaseInitialized()) {
            console.warn('⚠️ Supabase not available for token cleanup');
            return;
        }

        const tokens = await getData(DB_KEYS.PASSWORD_RESET_TOKENS) || [];
        const now = new Date();
        const validTokens = tokens.filter(token => {
            if (!token || !token.expires_at) return false;
            return new Date(token.expires_at) > now;
        });

        // Only update if tokens were actually removed
        if (validTokens.length < tokens.length) {
            await saveData(DB_KEYS.PASSWORD_RESET_TOKENS, validTokens);
            console.log(`🧹 Cleaned up ${tokens.length - validTokens.length} expired tokens`);
        }
    } catch (error) {
        console.error('❌ Error cleaning up expired tokens:', error);
    }
}

// Generate secure token
function generateToken() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Verify admin password
async function verifyAdminPassword(password) {
    try {
        const currentPassword = await getCurrentPassword();
        return password === currentPassword;
    } catch (error) {
        console.error('❌ Error verifying admin password:', error);
        
        // Show specific error messages to user
        if (error.message === 'Admin password not configured!') {
            showNotification('Admin password not configured. Please contact system administrator.', 'error');
        } else if (error.message === 'Database not available') {
            showNotification('Database connection failed. Please try again later.', 'error');
        } else {
            showNotification('Authentication error. Please try again.', 'error');
        }
        
        return false;
    }
}

// Check if user is authenticated
export function isAdminAuthenticated() {
    const sessionAuth = sessionStorage.getItem('admin_session') === 'true';
    const localAuth = localStorage.getItem('admin_session') === 'true';
    return sessionAuth || localAuth || adminAuthenticated;
}

// Admin login function
export async function adminLogin(password, rememberMe = false) {
    try {
        console.log('🔐 Attempting admin login...');
        
        const isValid = await verifyAdminPassword(password);
        
        if (isValid) {
            adminAuthenticated = true;
            if (rememberMe) {
                localStorage.setItem('admin_session', 'true');
            } else {
                sessionStorage.setItem('admin_session', 'true');
            }
            
            console.log('✅ Admin login successful');
            showNotification('Admin access granted!', 'success');
            return true;
        } else {
            console.log('❌ Admin login failed: Invalid password');
            showNotification('Invalid admin password!', 'error');
            return false;
        }
    } catch (error) {
        console.error('❌ Admin login error:', error);
        showNotification('Login error: ' + error.message, 'error');
        return false;
    }
}

// Admin logout function
export function adminLogout() {
    adminAuthenticated = false;
    sessionStorage.removeItem('admin_session');
    localStorage.removeItem('admin_session');
    console.log('👋 Admin logged out');
    showNotification('Admin session ended', 'info');
    window.location.reload();
}

// Request password reset - FIXED VERSION
export async function requestPasswordReset() {
    try {
        if (!await ensureSupabaseInitialized()) {
            showNotification('Database not available. Please try again later.', 'error');
            return false;
        }

        const token = generateToken();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        
        // FIXED: Don't include id field - let Supabase auto-generate it
        const resetToken = {
            token: token,
            email: ADMIN_EMAIL,
            expires_at: expiresAt.toISOString(),
            used: false,
            created_at: new Date().toISOString()
        };

        console.log('📧 Creating password reset token...', resetToken);

        // FIXED: Use direct Supabase insert instead of saveData to avoid id conflicts
        const { data, error } = await supabase
            .from(DB_KEYS.PASSWORD_RESET_TOKENS)
            .insert([resetToken])
            .select();

        if (error) {
            console.error('❌ Error inserting reset token:', error);
            
            // If it's a duplicate token error, try again with a new token
            if (error.code === '23505' && error.message.includes('token')) {
                console.log('🔄 Token collision, generating new token...');
                return await requestPasswordReset(); // Recursively try again
            }
            
            throw error;
        }

        console.log('✅ Password reset token created:', data);
        
        // In a real application, you would send an email here
        // For demo purposes, we'll show the token in an alert
        showNotification(`Password reset token: ${token} (Expires: ${expiresAt.toLocaleTimeString()})`, 'info');
        
        return true;
    } catch (error) {
        console.error('❌ Error requesting password reset:', error);
        
        if (error.code === '23505') {
            showNotification('Reset token already exists. Please try again.', 'error');
        } else {
            showNotification('Error requesting password reset: ' + error.message, 'error');
        }
        
        return false;
    }
}

// Verify reset token - FIXED VERSION
async function verifyResetToken(token) {
    try {
        if (!await ensureSupabaseInitialized()) {
            return false;
        }

        // FIXED: Use direct Supabase query for better performance
        const { data, error } = await supabase
            .from(DB_KEYS.PASSWORD_RESET_TOKENS)
            .select('*')
            .eq('token', token)
            .eq('used', false)
            .gt('expires_at', new Date().toISOString())
            .single();

        if (error) {
            console.error('❌ Error verifying reset token:', error);
            return false;
        }

        return !!data;
    } catch (error) {
        console.error('❌ Error verifying reset token:', error);
        return false;
    }
}

// Mark token as used - FIXED VERSION
async function markTokenAsUsed(token) {
    try {
        if (!await ensureSupabaseInitialized()) {
            return false;
        }

        // FIXED: Use direct Supabase update
        const { error } = await supabase
            .from(DB_KEYS.PASSWORD_RESET_TOKENS)
            .update({ used: true, updated_at: new Date().toISOString() })
            .eq('token', token);

        if (error) {
            console.error('❌ Error marking token as used:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('❌ Error marking token as used:', error);
        return false;
    }
}

// Reset admin password with token - FIXED VERSION
export async function resetAdminPassword(token, newPassword) {
    try {
        if (!await ensureSupabaseInitialized()) {
            throw new Error('Database not available');
        }

        const isValidToken = await verifyResetToken(token);
        if (!isValidToken) {
            throw new Error('Invalid or expired reset token');
        }

        await updateAdminPassword(newPassword);
        await markTokenAsUsed(token);

        console.log('✅ Admin password reset successfully');
        return true;
    } catch (error) {
        console.error('❌ Error resetting admin password:', error);
        throw error;
    }
}

// Password strength checker
export function checkPasswordStrength(password) {
    if (!password) return { strength: 0, text: 'Very Weak', color: '#dc3545' };
    
    let strength = 0;
    let feedback = [];

    // Length check
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;

    // Character variety checks
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 1;

    // Determine strength level
    let strengthText, strengthColor;
    if (strength <= 2) {
        strengthText = 'Very Weak';
        strengthColor = '#dc3545';
    } else if (strength <= 3) {
        strengthText = 'Weak';
        strengthColor = '#fd7e14';
    } else if (strength <= 4) {
        strengthText = 'Fair';
        strengthColor = '#ffc107';
    } else if (strength <= 5) {
        strengthText = 'Good';
        strengthColor = '#20c997';
    } else {
        strengthText = 'Strong';
        strengthColor = '#198754';
    }

    return {
        strength: (strength / 6) * 100,
        text: strengthText,
        color: strengthColor
    };
}

// Initialize admin authentication system
export async function initializeAdminAuth() {
    try {
        console.log('🔐 Initializing admin authentication system...');
        
        // Clean up expired tokens
        await cleanupExpiredTokens();
        
        // Check if admin password is configured
        try {
            const currentPassword = await getCurrentPassword();
            console.log('✅ Admin password configured');
        } catch (error) {
            if (error.message === 'Admin password not configured!') {
                console.error('❌ Admin password not configured - administrator must set it up first');
                showNotification('Admin password not configured. Please set up the system first.', 'error');
            }
            throw error;
        }
        
        console.log('✅ Admin authentication system ready');
        return true;
    } catch (error) {
        console.error('❌ Error initializing admin auth:', error);
        return false;
    }
}

// Setup authentication event listeners
export function setupAuthEventListeners() {
    console.log('🔧 Setting up authentication event listeners...');

    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const password = document.getElementById('admin-password')?.value;
            const rememberMe = document.getElementById('remember-me')?.checked || false;
            
            if (!password) {
                showNotification('Please enter admin password!', 'error');
                return;
            }

            const loginButton = this.querySelector('button[type="submit"]');
            const originalText = loginButton.innerHTML;
            
            loginButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Authenticating...';
            loginButton.disabled = true;

            try {
                const success = await adminLogin(password, rememberMe);
                if (success) {
                    setTimeout(() => {
                        window.location.href = 'admin.html';
                    }, 1000);
                }
            } finally {
                loginButton.innerHTML = originalText;
                loginButton.disabled = false;
            }
        });
    }

    // Forgot password link
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            document.getElementById('login-section').classList.add('d-none');
            document.getElementById('forgot-password-section').classList.remove('d-none');
        });
    }

    // Forgot password form
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitButton = this.querySelector('button[type="submit"]');
            const originalText = submitButton.innerHTML;
            
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Sending...';
            submitButton.disabled = true;

            try {
                const success = await requestPasswordReset();
                if (success) {
                    showNotification('Password reset instructions sent! Check your notifications for the reset token.', 'success');
                }
            } finally {
                submitButton.innerHTML = originalText;
                submitButton.disabled = false;
            }
        });
    }

    // Reset password form
    const resetPasswordForm = document.getElementById('reset-password-form');
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const token = document.getElementById('reset-token')?.value;
            const newPassword = document.getElementById('new-password')?.value;
            const confirmPassword = document.getElementById('confirm-password')?.value;

            if (!token || !newPassword || !confirmPassword) {
                showNotification('Please fill in all fields!', 'error');
                return;
            }

            if (newPassword !== confirmPassword) {
                showNotification('Passwords do not match!', 'error');
                return;
            }

            if (newPassword.length < 6) {
                showNotification('Password must be at least 6 characters long!', 'error');
                return;
            }

            const submitButton = this.querySelector('button[type="submit"]');
            const originalText = submitButton.innerHTML;
            
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Resetting...';
            submitButton.disabled = true;

            try {
                await resetAdminPassword(token, newPassword);
                showNotification('Password reset successfully!', 'success');
                
                // Return to login
                document.getElementById('reset-password-section').classList.add('d-none');
                document.getElementById('login-section').classList.remove('d-none');
                this.reset();
            } catch (error) {
                showNotification('Error: ' + error.message, 'error');
            } finally {
                submitButton.innerHTML = originalText;
                submitButton.disabled = false;
            }
        });
    }

    // Back to login links
    const backToLoginLinks = document.querySelectorAll('.back-to-login');
    backToLoginLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            document.getElementById('login-section').classList.remove('d-none');
            document.getElementById('forgot-password-section').classList.add('d-none');
            document.getElementById('reset-password-section').classList.add('d-none');
        });
    });

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Are you sure you want to logout?')) {
                adminLogout();
            }
        });
    }

    // Password strength indicator
    const newPasswordInput = document.getElementById('new-password');
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', function() {
            const strength = checkPasswordStrength(this.value);
            const strengthBar = document.getElementById('password-strength-bar');
            const strengthText = document.getElementById('password-strength-text');
            
            if (strengthBar && strengthText) {
                strengthBar.style.width = strength.strength + '%';
                strengthBar.style.backgroundColor = strength.color;
                strengthText.textContent = strength.text;
                strengthText.style.color = strength.color;
            }
        });
    }

    console.log('✅ Authentication event listeners setup complete');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Initializing authentication system...');
    
    // Initialize admin auth
    await initializeAdminAuth();
    
    // Setup event listeners
    setupAuthEventListeners();
    
    // Check if user is already authenticated
    if (isAdminAuthenticated() && window.location.pathname.includes('admin.html')) {
        console.log('🔓 User already authenticated, redirecting to dashboard...');
        // The admin.js will handle showing the dashboard
    }
});

// Make functions available globally
window.adminLogin = adminLogin;
window.adminLogout = adminLogout;
window.requestPasswordReset = requestPasswordReset;
window.resetAdminPassword = resetAdminPassword;
