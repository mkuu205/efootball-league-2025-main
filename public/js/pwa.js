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
                '/sw.js',                // Short version
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

            // Make sure install button is clickable immediately
            const installBtn = document.getElementById('install-button');
            if (installBtn) {
                installBtn.onclick = () => this.installApp();
                installBtn.style.display = 'block';
            }
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
            installBtn.className = 'btn btn-success';
            installBtn.style.cssText = `
                position: fixed !important;
                bottom: 20px !important;
                right: 20px !important;
                z-index: 10000 !important;
                background: linear-gradient(135deg, #28a745, #20c997) !important;
                border: none !important;
                color: white !important;
                padding: 12px 20px !important;
                border-radius: 50px !important;
                font-weight: 600 !important;
                box-shadow: 0 8px 25px rgba(40, 167, 69, 0.4) !important;
                transition: all 0.3s ease !important;
                animation: pulse 2s infinite !important;
                min-height: auto !important;
                display: flex !important;
                align-items: center !important;
                gap: 8px !important;
                opacity: 1 !important;
                visibility: visible !important;
            `;
            installBtn.innerHTML = `
                <i class="fas fa-download me-2"></i>
                <span class="d-none d-sm-inline">Install App</span>
                <span class="d-inline d-sm-none">Install</span>
            `;
            installBtn.onclick = () => this.installApp();

            document.body.appendChild(installBtn);

            // Auto-hide after 2 minutes (instead of 30s)
            setTimeout(() => {
                this.hideInstallPromotion();
            }, 120000);
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
        console.log('🟢 installApp() called, deferredPrompt =', this.deferredPrompt);

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
        } else {
            console.log('⚠️ No install prompt available');
        }
    }

    showUpdateNotification() {
        if (confirm('A new version of the app is available. Reload to update?')) {
            window.location.reload();
        }
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

    // Remove any existing theme toggle elements
    removeThemeToggle() {
        const themeToggles = document.querySelectorAll('.theme-toggle');
        themeToggles.forEach(toggle => {
            toggle.remove();
        });

        // Remove theme toggle from navbar
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            if (item.querySelector('.theme-toggle')) {
                item.remove();
            }
        });
    }
}

// Initialize PWA when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const pwaHelper = new PWAHelper();
    window.pwaHelper = pwaHelper;

    // Remove any theme toggle elements on startup
    pwaHelper.removeThemeToggle();

    // Additional cleanup for theme toggle
    const removeThemeElements = () => {
        // Remove theme toggle buttons
        const themeToggles = document.querySelectorAll('.theme-toggle');
        themeToggles.forEach(toggle => toggle.remove());

        // Remove theme-related list items
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            if (item.textContent.includes('moon') || item.textContent.includes('sun')) {
                item.remove();
            }
        });

        // Remove any theme toggle that might be created later
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) {
                        if (node.classList && node.classList.contains('theme-toggle')) {
                            node.remove();
                        }
                        if (node.querySelector && node.querySelector('.theme-toggle')) {
                            node.querySelector('.theme-toggle').remove();
                        }
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    };

    // Run cleanup immediately and after a short delay
    removeThemeElements();
    setTimeout(removeThemeElements, 100);
    setTimeout(removeThemeElements, 1000);
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PWAHelper;
}
