// ======================= AUTH.JS =======================

// Replace with your actual Supabase project details
const SUPABASE_URL = 'https://zliedzrqzvywlsyfggcq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsaWVkenJxenZ5d2xzeWZnZ2NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwOTE4NjYsImV4cCI6MjA3NjY2Nzg2Nn0.NbzEZ4ievehtrlyOxCK_mheb7YU4SnNgC0uXuOKPNOI'; // ANON key from Supabase settings
const ADMIN_EMAIL = 'support@kishtechsite.online';

// Initialize Supabase client (singleton)
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ======================= HELPER FUNCTIONS =======================

// Show notifications (simple example, replace with your UI logic)
function showNotification(message, type = 'info') {
    alert(`[${type.toUpperCase()}] ${message}`);
}

// Get current user session
async function getCurrentUser() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
        console.error('Error getting session:', error.message);
        return null;
    }
    return session?.user || null;
}

// ======================= SIGNUP =======================

async function signup(email, password) {
    try {
        const { data, error } = await supabase.auth.signUp(
            { email, password },
            { redirectTo: 'https://tournament.kishtechsite.online/auth.html' } // Must be whitelisted
        );

        if (error) {
            showNotification('Signup failed: ' + error.message, 'error');
            console.error('Signup error:', error);
            return;
        }

        showNotification('Signup successful! Please check your email to confirm.', 'success');
        console.log('Signup data:', data);

    } catch (err) {
        console.error('Unexpected signup error:', err);
        showNotification('Unexpected error during signup.', 'error');
    }
}

// ======================= LOGIN =======================

async function login(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            showNotification('Login failed: ' + error.message, 'error');
            console.error('Login error:', error);
            return;
        }

        showNotification('Login successful!', 'success');
        console.log('Login data:', data);

        // Redirect after login
        window.location.href = 'index.html';

    } catch (err) {
        console.error('Unexpected login error:', err);
        showNotification('Unexpected error during login.', 'error');
    }
}

// ======================= LOGOUT =======================

async function logout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) {
            showNotification('Logout failed: ' + error.message, 'error');
            return;
        }
        showNotification('Logged out successfully!', 'success');
        window.location.href = 'auth.html';
    } catch (err) {
        console.error('Unexpected logout error:', err);
        showNotification('Unexpected error during logout.', 'error');
    }
}

// ======================= PASSWORD RESET =======================

async function sendPasswordReset(email) {
    try {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: 'https://tournament.kishtechsite.online/auth.html'
        });

        if (error) {
            showNotification('Password reset failed: ' + error.message, 'error');
            console.error('Reset error:', error);
            return;
        }

        showNotification('Password reset email sent! Check your inbox.', 'success');
        console.log('Password reset data:', data);

    } catch (err) {
        console.error('Unexpected reset error:', err);
        showNotification('Unexpected error during password reset.', 'error');
    }
}

// ======================= AUTH CHECK =======================

// Returns true if logged in
async function checkAuth() {
    const user = await getCurrentUser();
    return !!user;
}

// Returns true if logged in and is admin
async function checkAdminAuth() {
    const user = await getCurrentUser();
    return user?.email === ADMIN_EMAIL;
}

// Protect all pages (client-side only)
async function protectAllPages() {
    if (window.location.pathname.includes('auth.html')) return;

    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) {
        console.log('Not authenticated, redirecting to auth page');
        window.location.href = 'auth.html';
        return;
    }
    console.log('User authenticated, allowing access');
}

// Protect admin page
async function protectAdminPage() {
    if (!window.location.pathname.includes('admin.html')) return;

    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
        showNotification(`Admin access required. Only ${ADMIN_EMAIL} can access this page.`, 'error');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 3000);
        return;
    }
}

// Update navigation based on auth state
async function updateNavigationAuth() {
    const isAuthenticated = await checkAuth();
    const authNav = document.getElementById('auth-nav');
    if (!authNav) return;

    if (isAuthenticated) {
        const user = await getCurrentUser();
        const isAdmin = user.email === ADMIN_EMAIL;
        authNav.innerHTML = `
            <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                    <i class="fas fa-user me-1"></i>${user.email} ${isAdmin ? '(Admin)' : ''}
                </a>
                <ul class="dropdown-menu dropdown-menu-dark">
                    ${isAdmin ? `<li><a class="dropdown-item" href="admin.html"><i class="fas fa-cog me-2"></i>Admin Panel</a></li><li><hr class="dropdown-divider"></li>` : ''}
                    <li><a class="dropdown-item" href="#" onclick="logout()"><i class="fas fa-sign-out-alt me-2"></i>Logout</a></li>
                </ul>
            </li>
        `;
    } else {
        authNav.innerHTML = `
            <li class="nav-item">
                <a class="nav-link" href="auth.html">
                    <i class="fas fa-sign-in-alt me-1"></i>Login
                </a>
            </li>
        `;
    }
}

// ======================= PAGE INITIALIZATION =======================

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Auth system initializing...');

    await protectAllPages();
    await updateNavigationAuth();
    await protectAdminPage();

    // Logout button in admin panel
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', e => { e.preventDefault(); logout(); });

    console.log('Auth system initialized');
});

// ======================= MAKE GLOBAL =======================
window.signup = signup;
window.login = login;
window.logout = logout;
window.sendPasswordReset = sendPasswordReset;
window.checkAuth = checkAuth;
window.checkAdminAuth = checkAdminAuth;
