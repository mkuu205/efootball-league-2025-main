// Simple Auth Functions for Main Site
const ADMIN_EMAIL = 'support@kishtechsite.online';

// Create Supabase client for live domain
const supabaseUrl = 'https://zliedzrqzvywlsyfggcq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsaWVkenJxenZ5d2xzeWZnZ2NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwOTE4NjYsImV4cCI6MjA3NjY2Nzg2Nn0.NbzEZ4ievehtrlyOxCK_mheb7YU4SnNgC0uXuOKPNOI';

const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// Check if user is authenticated
async function checkAuth() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
            console.error('Auth check error:', error);
            return false;
        }
        return !!session;
    } catch (error) {
        console.error('Auth check failed:', error);
        return false;
    }
}

// Check if user is admin
async function checkAdminAuth() {
    try {
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
        await supabase.auth.signOut();
        showNotification('Logged out successfully', 'success');
        setTimeout(() => {
            window.location.href = 'auth.html';
        }, 1000);
    } catch (error) {
        console.error('Logout error:', error);
        showNotification('Logout failed', 'error');
    }
}

// Update navigation based on auth state
async function updateNavigationAuth() {
    const authNav = document.getElementById('auth-nav');
    if (!authNav) return;

    try {
        const isAuthenticated = await checkAuth();

        if (isAuthenticated) {
            const { data: { session } } = await supabase.auth.getSession();
            const userEmail = session?.user?.email || 'User';
            const isAdmin = userEmail === ADMIN_EMAIL;

            authNav.innerHTML = `
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                        <i class="fas fa-user me-1"></i>${userEmail} ${isAdmin ? '(Admin)' : ''}
                    </a>
                    <ul class="dropdown-menu dropdown-menu-dark">
                        ${isAdmin ? `
                            <li><a class="dropdown-item" href="admin.html"><i class="fas fa-cog me-2"></i>Admin Panel</a></li>
                            <li><hr class="dropdown-divider"></li>
                        ` : ''}
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
    } catch (error) {
        console.error('Navigation update error:', error);
        authNav.innerHTML = `
            <li class="nav-item">
                <a class="nav-link" href="auth.html">
                    <i class="fas fa-sign-in-alt me-1"></i>Login
                </a>
            </li>
        `;
    }
}

// Protect pages - but don't redirect on auth.html
async function protectPages() {
    // Never protect auth.html
    if (window.location.pathname.includes('auth.html')) {
        return;
    }

    try {
        const isAuthenticated = await checkAuth();
        
        // Only redirect if we're sure user is not authenticated
        if (!isAuthenticated) {
            console.log('User not authenticated, redirecting to auth page');
            window.location.href = 'auth.html';
        }
    } catch (error) {
        console.error('Page protection error:', error);
        // Don't redirect on error to avoid loops
    }
}

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Auth system initializing...');
    
    // Update navigation (this never redirects)
    await updateNavigationAuth();
    
    // Only protect pages if not on auth page
    if (!window.location.pathname.includes('auth.html')) {
        await protectPages();
    }
    
    console.log('Auth system initialized');
});

// Make functions global
window.logout = logout;
window.checkAuth = checkAuth;
window.checkAdminAuth = checkAdminAuth;