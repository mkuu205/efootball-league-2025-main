// Simple Auth Functions for Main Site
const ADMIN_EMAIL = 'support@kishtechsite.online';


// Supabase setup
const supabaseUrl = 'https://zliedzrqzvywlsyfggcq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsaWVkenJxenZ5d2xzeWZnZ2NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwOTE4NjYsImV4cCI6MjA3NjY2Nzg2Nn0.NbzEZ4ievehtrlyOxCK_mheb7YU4SnNgC0uXuOKPNOI'; // Use the anon public key
const supabase = supabase.createClient(supabaseUrl, supabaseKey);



// Track redirect state to prevent loops
let redirectInProgress = false;

// Beautiful Notification System
function showNotification(message, type = 'info') {
    // Create notification container if it doesn't exist
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            max-width: 400px;
        `;
        document.body.appendChild(container);
        
        // Add CSS animations if not already added
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                @keyframes slideOutRight {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
                
                .notification {
                    background: linear-gradient(135deg, #ff4444, #cc0000);
                    color: white;
                    padding: 16px 20px;
                    margin-bottom: 10px;
                    border-radius: 12px;
                    box-shadow: 0 8px 25px rgba(0,0,0,0.2);
                    border-left: 4px solid rgba(255,255,255,0.3);
                    backdrop-filter: blur(10px);
                    animation: slideInRight 0.3s ease-out;
                    min-width: 300px;
                }
            `;
            document.head.appendChild(style);
        }
    }

    const notification = document.createElement('div');
    
    const styles = {
        success: {
            background: 'linear-gradient(135deg, #4CAF50, #45a049)',
            icon: 'fas fa-check-circle',
            title: 'Success!'
        },
        error: {
            background: 'linear-gradient(135deg, #ff4444, #cc0000)',
            icon: 'fas fa-exclamation-triangle',
            title: 'Oops!'
        },
        warning: {
            background: 'linear-gradient(135deg, #ff9800, #f57c00)',
            icon: 'fas fa-exclamation-circle',
            title: 'Warning'
        },
        info: {
            background: 'linear-gradient(135deg, #2196F3, #1976D2)',
            icon: 'fas fa-info-circle',
            title: 'Info'
        }
    };

    const style = styles[type] || styles.info;

    notification.innerHTML = `
        <div class="notification" style="
            background: ${style.background};
            color: white;
            padding: 16px 20px;
            margin-bottom: 10px;
            border-radius: 12px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.2);
            border-left: 4px solid rgba(255,255,255,0.3);
            backdrop-filter: blur(10px);
            animation: slideInRight 0.3s ease-out;
            min-width: 300px;
        ">
            <div style="display: flex; align-items: flex-start; gap: 12px;">
                <i class="${style.icon}" style="font-size: 20px; margin-top: 2px;"></i>
                <div style="flex: 1;">
                    <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${style.title}</div>
                    <div style="font-size: 13px; line-height: 1.4; opacity: 0.9;">${message}</div>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: none;
                    border: none;
                    color: white;
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 4px;
                    opacity: 0.7;
                    transition: opacity 0.2s;
                " onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `;

    container.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Check if user is authenticated
async function checkAuth() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error('Auth check error:', error);
            return false;
        }
        
        console.log('Session check:', {
            hasSession: !!session,
            user: session?.user?.email,
            expires: session?.expires_at
        });
        
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
            window.location.href = 'https://tournament.kishtechsite.online/auth.html';
        }, 1000);
    } catch (error) {
        console.error('Logout error:', error);
        showNotification('Logout failed', 'error');
    }
}

// Update navigation based on auth state
async function updateNavigationAuth() {
    const authNav = document.getElementById('auth-nav');
    if (!authNav) {
        console.log('auth-nav element not found');
        return;
    }

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

            // Show admin nav item if user is admin
            const adminNavItem = document.getElementById('admin-nav-item');
            if (adminNavItem && isAdmin) {
                adminNavItem.style.display = 'block';
            }
        } else {
            authNav.innerHTML = `
                <li class="nav-item">
                    <a class="nav-link" href="https://tournament.kishtechsite.online/auth.html">
                        <i class="fas fa-sign-in-alt me-1"></i>Login
                    </a>
                </li>
            `;
        }
    } catch (error) {
        console.error('Navigation update error:', error);
        authNav.innerHTML = `
            <li class="nav-item">
                <a class="nav-link" href="https://tournament.kishtechsite.online/auth.html">
                    <i class="fas fa-sign-in-alt me-1"></i>Login
                </a>
            </li>
        `;
    }
}

// Protect pages - with loop prevention
async function protectPages() {
    // Never protect auth.html
    if (window.location.pathname.includes('auth.html') || 
        window.location.href.includes('auth.html')) {
        console.log('Auth page - skipping protection');
        return;
    }

    // Prevent multiple redirects
    if (redirectInProgress) {
        console.log('Redirect already in progress, skipping');
        return;
    }

    try {
        const isAuthenticated = await checkAuth();
        
        if (!isAuthenticated) {
            console.log('User not authenticated, redirecting to auth page');
            redirectInProgress = true;
            
            // Use a small delay to allow logs to show
            setTimeout(() => {
                window.location.href = 'https://tournament.kishtechsite.online/auth.html';
            }, 100);
        } else {
            console.log('User authenticated, allowing access');
        }
    } catch (error) {
        console.error('Page protection error:', error);
        // Don't redirect on error to avoid loops
    }
}

// Initialize app features after authentication
function initializeAppFeatures() {
    console.log('Initializing app features...');
    
    // Initialize any app-specific features that depend on authentication
    if (typeof dataSync !== 'undefined' && typeof dataSync.initialize === 'function') {
        dataSync.initialize();
    }
    
    if (typeof imageExporter !== 'undefined' && typeof imageExporter.initialize === 'function') {
        imageExporter.initialize();
    }
    
    // Initialize tab system
    const tabLinks = document.querySelectorAll('[data-tab]');
    tabLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const tabId = this.getAttribute('data-tab');
            
            // Hide all tab panes
            document.querySelectorAll('.tab-pane').forEach(pane => {
                pane.classList.remove('show', 'active');
            });
            
            // Show selected tab pane
            const targetPane = document.getElementById(tabId);
            if (targetPane) {
                targetPane.classList.add('show', 'active');
            }
            
            // Update active nav link
            document.querySelectorAll('.nav-link').forEach(navLink => {
                navLink.classList.remove('active');
            });
            this.classList.add('active');
        });
    });
    
    console.log('App features initialized');
}

// Initialize auth on page load for main site
document.addEventListener('DOMContentLoaded', async function() {
    console.log('=== AUTH SYSTEM INITIALIZING ===');
    console.log('Current page:', window.location.pathname);
    
    // Update navigation (this never redirects)
    await updateNavigationAuth();
    
    // Only protect pages if not on auth page
    if (!window.location.pathname.includes('auth.html')) {
        await protectPages();
    }
    
    console.log('=== AUTH SYSTEM INITIALIZED ===');
});

// Make functions global
window.logout = logout;
window.checkAuth = checkAuth;
window.checkAdminAuth = checkAdminAuth;
window.showNotification = showNotification;
window.initializeAppFeatures = initializeAppFeatures;
