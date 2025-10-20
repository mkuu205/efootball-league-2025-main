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
        
        // Setup network detection
        this.setupNetworkDetection();
        
        // Setup iOS install prompt
        this.setupIOSInstallPrompt();
    }

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            // Try different possible service worker filenames
            const swPaths = [
                '/service-worker.js',    // Most common
                '/sw.js',               // Short version
                '/js/service-worker.js', // If it's in js folder
                '/service worker.js'     // If it has space (not recommended)
            ];

            const registerSW = async (path) => {
                try {
                    const registration = await navigator.serviceWorker.register(path, {
                        scope: '/'
                    });
                    console.log('✅ Service Worker registered successfully: ', registration);
                    return registration;
                } catch (error) {
                    console.log(`❌ Failed to register ${path}:`, error.message);
                    return null;
                }
            };

            // Try each path until one works
            const tryRegister = async (index = 0) => {
                if (index >= swPaths.length) {
                    console.error('❌ All Service Worker registration attempts failed');
                    this.showNotification('Service Worker registration failed. Some features may not work.', 'warning');
                    return;
                }

                const registration = await registerSW(swPaths[index]);
                if (!registration) {
                    await tryRegister(index + 1);
                } else {
                    // Setup update listener only when registration succeeds
                    this.setupUpdateListener(registration);
                }
            };

            tryRegister();
        } else {
            console.log('❌ Service Worker not supported in this browser');
        }
    }

    setupUpdateListener(registration) {
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

        // Check for controlling service worker
        if (navigator.serviceWorker.controller) {
            console.log('✅ Service Worker is controlling the page');
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
                transition: all 0.3s ease;
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
        // Remove existing theme toggle if any
        const existingToggle = document.querySelector('.theme-toggle');
        if (existingToggle) {
            existingToggle.remove();
        }

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
        } else {
            // Fallback: add to body
            themeToggle.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 1000;';
            document.body.appendChild(themeToggle);
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
            themeToggle.className = theme === 'light' ? 
                'btn btn-outline-dark btn-sm theme-toggle' : 
                'btn btn-outline-light btn-sm theme-toggle';
        }
        
        // Update meta theme-color
        const themeColor = theme === 'light' ? '#f8f9fa' : '#1a1a2e';
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            document.head.appendChild(metaThemeColor);
        }
        metaThemeColor.setAttribute('content', themeColor);
    }

    showNotification(message, type = 'info', duration = 3000) {
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
                transition: all 0.3s ease;
            `;
            notification.innerHTML = `
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.style.opacity = '0';
                    notification.style.transform = 'translateX(100%)';
                    setTimeout(() => {
                        if (notification.parentNode) {
                            notification.parentNode.removeChild(notification);
                        }
                    }, 300);
                }
            }, duration);
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
                setTimeout(() => {
                    this.showNotification('Tap the share button and "Add to Home Screen" to install', 'info', 10000);
                }, 3000);
            }
        }
    }
}

// Initialize PWA when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.pwaHelper = new PWAHelper();
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PWAHelper;
}
