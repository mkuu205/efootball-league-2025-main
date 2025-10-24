// Replace with your actual Supabase project details
const SUPABASE_URL = 'https://zliedzrqzvywlsyfggcq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsaWVkenJxenZ5d2xzeWZnZ2NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwOTE4NjYsImV4cCI6MjA3NjY2Nzg2Nn0.NbzEZ4ievehtrlyOxCK_mheb7YU4SnNgC0uXuOKPNOI';
const ADMIN_EMAIL = 'support@kishtechsite.online';

// Simple Auth Functions for Main Site

// Check if user is authenticated
async function checkAuth() {
    try {
        const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        const { data: { session } } = await supabase.auth.getSession();
        return !!session;
    } catch (error) {
        console.error('Auth check failed:', error);
        return false;
    }
}

// Check if user is admin
async function checkAdminAuth() {
    try {
        const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        const { data: { session } } = await supabase.auth.getSession();
        return session?.user?.email === ADMIN_EMAIL;
    } catch (error) {
        console.error('Admin auth check failed:', error);
        return false;
    }
}

// Simple logout function
async function logout() {
    try {
        const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        await supabase.auth.signOut();
        showNotification('Logged out successfully', 'success');
        
        // Redirect to auth page after logout
        setTimeout(() => {
            window.location.href = 'auth.html';
        }, 1000);
        
    } catch (error) {
        showNotification('Logout failed', 'error');
    }
}

// Update navigation based on auth state
async function updateNavigationAuth() {
    const isAuthenticated = await checkAuth();
    const authNav = document.getElementById('auth-nav');
    
    if (!authNav) return;
    
    if (isAuthenticated) {
        try {
            const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            const { data: { session } } = await supabase.auth.getSession();
            const userEmail = session?.user?.email || 'User';
            
            authNav.innerHTML = `
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                        <i class="fas fa-user me-1"></i>${userEmail}
                    </a>
                    <ul class="dropdown-menu dropdown-menu-dark">
                        ${userEmail === ADMIN_EMAIL ? `
                            <li><a class="dropdown-item" href="admin.html"><i class="fas fa-cog me-2"></i>Admin Panel</a></li>
                            <li><hr class="dropdown-divider"></li>
                        ` : ''}
                        <li><a class="dropdown-item" href="#" onclick="logout()"><i class="fas fa-sign-out-alt me-2"></i>Logout</a></li>
                    </ul>
                </li>
            `;
        } catch (error) {
            authNav.innerHTML = `
                <li class="nav-item">
                    <a class="nav-link" href="auth.html">
                        <i class="fas fa-sign-in-alt me-1"></i>Login
                    </a>
                </li>
            `;
        }
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

// Protect main site - redirect to auth if not authenticated
async function protectMainSite() {
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        const isAuthenticated = await checkAuth();
        
        if (!isAuthenticated) {
            window.location.href = 'auth.html';
            return;
        }
    }
}

// Protect admin page
async function protectAdminPage() {
    if (!window.location.pathname.includes('admin.html')) return;
    
    const isAdmin = await checkAdminAuth();
    
    if (!isAdmin) {
        window.location.href = 'auth.html';
        return;
    }
    
    // Show admin dashboard if authenticated
    document.getElementById('login-section')?.classList.add('d-none');
    document.getElementById('admin-dashboard')?.classList.remove('d-none');
}

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', async function() {
    await protectMainSite();
    await updateNavigationAuth();
    await protectAdminPage();
    
    // Setup logout button in admin panel
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
});

// Make logout function global
window.logout = logout;
window.checkAuth = checkAuth;
window.checkAdminAuth = checkAdminAuth;
