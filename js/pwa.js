// PWA Installation and Service Worker Registration
class PWAHelper {
    constructor() {
        this.deferredPrompt = null;
        this.isPWA = false;
        this.init();
    }

    init() {
        // Register service worker
        this.registerServiceWorker();
        
        // Listen for install prompt
        this.setupInstallPrompt();
        
        // Check if running as PWA
        this.checkPWAStatus();
        
        // Setup theme toggle
        this.setupThemeToggle();
    }

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('✅ Service Worker registered: ', registration);
                    
                    // Check for updates
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        console.log('🔄 Service Worker update found!');
                        
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                this.showUpdateNotification();
                            }
                        });
                    });
                })
                .catch(registrationError => {
                    console.log('❌ Service Worker registration failed: ', registrationError);
                });
        }
    }

    setupInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallPromotion();
            
            // Log installability
            console.log('📱 PWA install prompt available');
        });

        window.addEventListener('appinstalled', () => {
            console.log('✅ PWA was installed successfully');
            this.isPWA = true;
            this.hideInstallPromotion();
            this.showNotification('App installed successfully!', 'success');
        });
    }

    checkPWAStatus() {
        // Check if app is running in standalone mode
        this.isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                     window.navigator.standalone === true;
        
        if (this.isPWA) {
            console.log('📱 Running as installed PWA');
            document.body.classList.add('pwa-mode');
        }
    }

    showInstallPromotion() {
        // Don't show if already installed or in PWA mode
        if (this.isPWA) return;
        
        // Create install button if not exists
        if (!document.getElementById('install-button')) {
            const installBtn = document.createElement('button');
            installBtn.id = 'install-button';
            installBtn.className = 'btn btn-success position-fixed';
            installBtn.style.cssText = `
                bottom: 20px; 
                right: 20px; 
                z-index: 1000; 
                box-shadow: 0 4px 15px rgba(40, 167, 69, 0.4);
                font-weight: 600;
            `;
            installBtn.innerHTML = `
                <i class="fas fa-download me-2"></i>
                <span class="d-none d-sm-inline">Install App</span>
                <span class="d-inline d-sm-none">Install</span>
            `;
            installBtn.onclick = () => this.installApp();
            
            document.body.appendChild(installBtn);
            
            // Auto-hide after 30 seconds
            setTimeout(() => {
                this.hideInstallPromotion();
            }, 30000);
        }
    }

    hideInstallPromotion() {
        const installBtn = document.getElementById('install-button');
        if (installBtn) {
            installBtn.style.opacity = '0';
            installBtn.style.transform = 'translateY(20px)';
            setTimeout(() => {
                if (installBtn.parentNode) {
                    installBtn.parentNode.removeChild(installBtn);
                }
            }, 300);
        }
    }

    async installApp() {
        if (this.deferredPrompt) {
            this.deferredPrompt.prompt();
            const { outcome } = await this.deferredPrompt.userChoice;
            
            if (outcome === 'accepted') {
                console.log('✅ User accepted the install prompt');
                this.showNotification('Installing app...', 'info');
            } else {
                console.log('❌ User dismissed the install prompt');
                this.showNotification('Installation cancelled', 'warning');
            }
            
            this.deferredPrompt = null;
            this.hideInstallPromotion();
        }
    }

    showUpdateNotification() {
        if (confirm('A new version of the app is available. Reload to update?')) {
            window.location.reload();
        }
    }

    setupThemeToggle() {
        // Check for saved theme or prefer-color-scheme
        const savedTheme = localStorage.getItem('efl-theme') || 'dark';
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        let theme = savedTheme === 'system' ? (systemPrefersDark ? 'dark' : 'light') : savedTheme;
        
        this.setTheme(theme);
        
        // Create theme toggle button
        this.createThemeToggle(theme);
        
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (localStorage.getItem('efl-theme') === 'system') {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    createThemeToggle(currentTheme) {
        const themeToggle = document.createElement('button');
        themeToggle.className = 'btn btn-outline-light btn-sm theme-toggle';
        themeToggle.innerHTML = currentTheme === 'light' ? 
            '<i class="fas fa-moon me-1"></i>' : 
            '<i class="fas fa-sun me-1"></i>';
        themeToggle.title = `Switch to ${currentTheme === 'light' ? 'dark' : 'light'} theme`;
        themeToggle.onclick = () => this.toggleTheme();
        
        // Add to navbar if it exists
        const navbarNav = document.querySelector('.navbar-nav');
        if (navbarNav) {
            const li = document.createElement('li');
            li.className = 'nav-item';
            li.appendChild(themeToggle);
            navbarNav.appendChild(li);
        }
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('efl-theme', theme);
        
        // Update theme toggle button
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            themeToggle.innerHTML = theme === 'light' ? 
                '<i class="fas fa-moon me-1"></i>' : 
                '<i class="fas fa-sun me-1"></i>';
            themeToggle.title = `Switch to ${theme === 'light' ? 'dark' : 'light'} theme`;
        }
        
        // Update meta theme-color
        const themeColor = theme === 'light' ? '#f8f9fa' : '#1a1a2e';
        document.querySelector('meta[name="theme-color"]').setAttribute('content', themeColor);
    }

    showNotification(message, type = 'info') {
        // Use existing notification system or create simple one
        if (typeof showNotification === 'function') {
            showNotification(message, type);
        } else {
            // Fallback notification
            const notification = document.createElement('div');
            notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
            notification.style.cssText = `
                top: 80px;
                right: 20px;
                z-index: 1060;
                min-width: 250px;
            `;
            notification.innerHTML = `
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 3000);
        }
    }

    // Network status detection
    setupNetworkDetection() {
        window.addEventListener('online', () => {
            this.showNotification('Connection restored', 'success');
            document.body.classList.remove('offline');
        });

        window.addEventListener('offline', () => {
            this.showNotification('You are offline', 'warning');
            document.body.classList.add('offline');
        });
    }

    // Add to home screen for iOS
    setupIOSInstallPrompt() {
        // Detect iOS
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        
        if (isIOS) {
            const isInStandaloneMode = window.navigator.standalone;
            
            if (!isInStandaloneMode) {
                this.showNotification('Tap the share button and "Add to Home Screen" to install', 'info', 10000);
            }
        }
    }
}

// Initialize PWA
const pwaHelper = new PWAHelper();

// Export for global access
window.pwaHelper = pwaHelper;
