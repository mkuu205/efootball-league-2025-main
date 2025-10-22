// API Service for eFootball League - Fully Online Version
const API_BASE_URL = '/api';

class EFLAPI {
    constructor() {
        this.baseURL = API_BASE_URL;
        this.isOnline = true; // Always assume online now
        this.cache = new Map(); // Simple cache for performance
        this.checkConnection();
    }

    async checkConnection() {
        try {
            const response = await fetch(`${this.baseURL}/health`, { 
                method: 'GET',
                headers: { 'Cache-Control': 'no-cache' }
            });
            if (response.ok) {
                const data = await response.json();
                this.isOnline = data.status === 'online';
                if (this.isOnline) {
                    console.log('✅ API server is online with MongoDB');
                } else {
                    console.warn('⚠️ API server responded but not online');
                }
            } else {
                this.isOnline = false;
                console.error('❌ API health check failed:', response.status);
                throw new Error(`Server error: ${response.status}`);
            }
        } catch (error) {
            this.isOnline = false;
            console.error('❌ API server not available:', error);
            throw new Error('Cannot connect to server. Please check your internet connection and try again.');
        }
    }

    async request(endpoint, options = {}) {
        if (!this.isOnline) {
            throw new Error('Server is offline. Please check your connection and refresh the page.');
        }

        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                headers: { 
                    'Content-Type': 'application/json',
                    ...options.headers 
                },
                ...options,
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`API Error ${response.status}:`, errorText);
                throw new Error(`Server error: ${response.status} - ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Clear cache for specific data type
    clearCache(type = null) {
        if (type) {
            this.cache.delete(type);
        } else {
            this.cache.clear();
        }
    }

    // ===== Players API =====
    async getPlayers(forceRefresh = false) {
        if (!forceRefresh && this.cache.has('players')) {
            return this.cache.get('players');
        }
        const result = await this.request('/players');
        this.cache.set('players', result.players);
        return result.players;
    }

    async addPlayer(player) {
        const result = await this.request('/players', { 
            method: 'POST', 
            body: JSON.stringify(player) 
        });
        this.clearCache('players');
        return result.player;
    }

    async updatePlayer(id, updates) {
        const result = await this.request('/players', { 
            method: 'PUT', 
            body: JSON.stringify({ id, ...updates }) 
        });
        this.clearCache('players');
        return result.player;
    }

    async deletePlayer(id) {
        await this.request(`/players?id=${id}`, { method: 'DELETE' });
        this.clearCache('players');
    }

    // ===== Fixtures API =====
    async getFixtures(forceRefresh = false) {
        if (!forceRefresh && this.cache.has('fixtures')) {
            return this.cache.get('fixtures');
        }
        const result = await this.request('/fixtures');
        this.cache.set('fixtures', result.fixtures);
        return result.fixtures;
    }

    async addFixture(fixture) {
        const result = await this.request('/fixtures', { 
            method: 'POST', 
            body: JSON.stringify(fixture) 
        });
        this.clearCache('fixtures');
        return result.fixture;
    }

    async updateFixture(id, updates) {
        const result = await this.request('/fixtures', { 
            method: 'PUT', 
            body: JSON.stringify({ id, ...updates }) 
        });
        this.clearCache('fixtures');
        return result.fixture;
    }

    async deleteFixture(id) {
        await this.request(`/fixtures?id=${id}`, { method: 'DELETE' });
        this.clearCache('fixtures');
    }

    // ===== Results API =====
    async getResults(forceRefresh = false) {
        if (!forceRefresh && this.cache.has('results')) {
            return this.cache.get('results');
        }
        const result = await this.request('/results');
        this.cache.set('results', result.results);
        return result.results;
    }

    async addResult(resultData) {
        const result = await this.request('/results', { 
            method: 'POST', 
            body: JSON.stringify(resultData) 
        });
        this.clearCache('results');
        return result.result;
    }

    async updateResult(id, updates) {
        const result = await this.request('/results', { 
            method: 'PUT', 
            body: JSON.stringify({ id, ...updates }) 
        });
        this.clearCache('results');
        return result.result;
    }

    async deleteResult(id) {
        await this.request(`/results?id=${id}`, { method: 'DELETE' });
        this.clearCache('results');
    }

    // ===== All Data =====
    async getAllData() {
        const [players, fixtures, results] = await Promise.all([
            this.getPlayers(true),
            this.getFixtures(true),
            this.getResults(true)
        ]);
        return { players, fixtures, results };
    }

    // ===== Initialize DB =====
    async initializeDatabase() {
        return await this.request('/initialize', { method: 'POST' });
    }
}

// Create global API instance
const eflAPI = new EFLAPI();

// =======================================================
// 🔔 NOTIFICATION SYSTEM (Updated for online mode)
// =======================================================
function showNotification(message, type = 'info') {
    const colors = {
        success: '#198754',
        error: '#dc3545',
        warning: '#ffc107',
        info: '#0dcaf0'
    };

    const existing = document.getElementById('toast-temp');
    if (existing) existing.remove();

    const div = document.createElement('div');
    div.id = 'toast-temp';
    div.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #212529;
        color: #f8f9fa;
        border-left: 4px solid ${colors[type] || colors.info};
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 0 10px rgba(0,0,0,0.5);
        z-index: 2000;
        min-width: 250px;
        font-size: 14px;
        transition: all 0.3s ease;
        opacity: 1;
    `;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    div.innerHTML = `<i class="fas ${icons[type] || icons.info} me-2" style="color:${colors[type]};"></i>${message}`;

    document.body.appendChild(div);

    setTimeout(() => {
        div.style.opacity = '0';
        div.style.transform = 'translateY(-10px)';
        setTimeout(() => div.remove(), 300);
    }, 4000);
}

// =======================================================
// 🌐 CONNECTION STATUS HANDLER (Updated for online mode)
// =======================================================
function updateSyncStatus() {
    const statusElement = document.getElementById('sync-status');
    if (!statusElement) return;
    
    if (eflAPI.isOnline) {
        statusElement.innerHTML = '<i class="fas fa-cloud me-1"></i>Online';
        statusElement.className = 'badge bg-success';
        statusElement.title = 'Fully online mode - Connected to server';
    } else {
        statusElement.innerHTML = '<i class="fas fa-cloud-slash me-1"></i>Offline';
        statusElement.className = 'badge bg-danger';
        statusElement.title = 'Server connection failed - Please refresh';
    }
}

// =======================================================
// ⚙️ EVENT HANDLERS (Simplified for online mode)
// =======================================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initializing fully online mode...');
    
    try {
        // Wait for API connection
        await eflAPI.checkConnection();
        updateSyncStatus();
        
        console.log('✅ Fully online mode initialized');
        showNotification('Connected to server successfully', 'success');
        
    } catch (error) {
        console.error('❌ Failed to initialize online mode:', error);
        updateSyncStatus();
        showNotification('Server connection failed: ' + error.message, 'error');
    }

    // Periodic connection check (every 5 minutes)
    setInterval(async () => {
        try {
            await eflAPI.checkConnection();
            updateSyncStatus();
        } catch (error) {
            console.warn('Periodic connection check failed:', error);
            updateSyncStatus();
        }
    }, 300000); // 5 minutes

    // Manual refresh button handler
    const refreshBtn = document.getElementById('manual-refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            try {
                showNotification('Refreshing data from server...', 'info');
                eflAPI.clearCache(); // Clear all cache
                
                if (typeof refreshAllDisplays === 'function') {
                    await refreshAllDisplays();
                } else {
                    // Fallback: reload page if refresh function not available
                    window.location.reload();
                }
                
                showNotification('Data refreshed successfully', 'success');
            } catch (error) {
                console.error('Manual refresh failed:', error);
                showNotification('Refresh failed: ' + error.message, 'error');
            }
        });
    }
});

// Global error handler for network issues
window.addEventListener('online', () => {
    console.log('🌐 Browser is online, checking server connection...');
    eflAPI.checkConnection().then(updateSyncStatus);
});

window.addEventListener('offline', () => {
    console.log('🌐 Browser is offline');
    eflAPI.isOnline = false;
    updateSyncStatus();
    showNotification('Your device lost internet connection', 'warning');
});
