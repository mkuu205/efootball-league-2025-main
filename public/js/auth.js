// Simple Auth Functions for Main Site
const ADMIN_EMAIL = 'support@kishtechsite.online';

// Check if user is authenticated
async function checkAuth() {
    try {
        const supabase = supabase.createClient(
            'https://zliedzrqzvywlsyfggcq.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsaWVkenJxenZ5d2xzeWZnZ2NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwOTE4NjYsImV4cCI6MjA3NjY2Nzg2Nn0.NbzEZ4ievehtrlyOxCK_mheb7YU4SnNgC0uXuOKPNOI'
        );
        
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
        const supabase = supabase.createClient(
            'https://zliedzrqzvywlsyfggcq.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsaWVkenJxenZ5d2xzeWZnZ2NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwOTE4NjYsImV4cCI6MjA3NjY2Nzg2Nn0.NbzEZ4ievehtrlyOxCK_mheb7YU4SnNgC0uXuOKPNOI'
        );
        
        const { data: { session } } = await supabase.auth.getSession();
        const isAdmin = session?.user?.email === ADMIN_EMAIL;
        
        console.log('Admin check:', {
            userEmail: session?.user?.email,
            isAdmin: isAdmin
        });
        
        return isAdmin;
    } catch (error) {
        console.error('Admin auth check failed:', error);
        return false;
    }
}

// Simple logout function
async function logout() {
    try {
        const supabase = supabase.createClient(
            'https://zliedzrqzvywlsyfggcq.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsaWVkenJxenZ5d2xzeWZnZ2NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwOTE4NjYsImV4cCI6MjA3NjY2Nzg2Nn0.NbzEZ4ievehtrlyOxCK_mheb7YU4SnNgC0uXuOKPNOI'
        );
        
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
            const supabase = supabase.createClient(
                'https://zliedzrqzvywlsyfggcq.supabase.co',
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsaWVkenJxenZ5d2xzeWZnZ2NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwOTE4NjYsImV4cCI6MjA3NjY2Nzg2Nn0.NbzEZ4ievehtrlyOxCK_mheb7YU4SnNgC0uXuOKPNOI'
            );
            
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

// Protect ALL pages - redirect to auth if not authenticated (CLIENT-SIDE ONLY)
async function protectAllPages() {
    // Don't protect the auth page itself
    if (window.location.pathname.includes('auth.html')) {
        return;
    }
    
    const isAuthenticated = await checkAuth();
    
    if (!isAuthenticated) {
        console.log('Not authenticated, redirecting to auth page');
        window.location.href = 'auth.html';
        return;
    }
    
    console.log('User is authenticated, allowing access');
}

// Protect admin page - require admin email
async function protectAdminPage() {
    if (!window.location.pathname.includes('admin.html')) return;
    
    const isAdmin = await checkAdminAuth();
    
    if (!isAdmin) {
        const currentUser = await getCurrentUserEmail();
        showNotification(`Admin access required. Only ${ADMIN_EMAIL} can access this page. (You are: ${currentUser})`, 'error');
        
        // Redirect to main site if not admin after 3 seconds
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 3000);
        return;
    }
    
    // Show admin dashboard if authenticated as admin
    const loginSection = document.getElementById('login-section');
    const adminDashboard = document.getElementById('admin-dashboard');
    
    if (loginSection && adminDashboard) {
        loginSection.classList.add('d-none');
        adminDashboard.classList.remove('d-none');
        
        // Update admin info
        const adminInfo = document.getElementById('admin-info');
        if (adminInfo) {
            adminInfo.textContent = `Logged in as: ${ADMIN_EMAIL} (Administrator)`;
        }
    }
}

// Get current user email
async function getCurrentUserEmail() {
    try {
        const supabase = supabase.createClient(
            'https://zliedzrqzvywlsyfggcq.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsaWVkenJxenZ5d2xzeWZnZ2NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwOTE4NjYsImV4cCI6MjA3NjY2Nzg2Nn0.NbzEZ4ievehtrlyOxCK_mheb7YU4SnNgC0uXuOKPNOI'
        );
        
        const { data: { session } } = await supabase.auth.getSession();
        return session?.user?.email || 'Not logged in';
    } catch (error) {
        return 'Error getting user';
    }
}

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Auth system initializing...');
    
    // Protect ALL pages (client-side only)
    await protectAllPages();
    
    // Update navigation based on auth state
    await updateNavigationAuth();
    
    // Protect admin page specifically
    await protectAdminPage();
    
    // Setup logout button in admin panel
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
    
    console.log('Auth system initialized');
});

// Make logout function global
window.logout = logout;
window.checkAuth = checkAuth;
window.checkAdminAuth = checkAdminAuth;
