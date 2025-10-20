// API Service for eFootball League - Render Version
//const API_BASE_URL = '/api';
const API_BASE_URL = 'https://efootball-league-2025-main.onrender.com/api';

class EFLAPI {
    constructor() {
        this.baseURL = API_BASE_URL;
        this.isOnline = false;
        this.checkConnection();
    }

    async checkConnection() {
        try {
            const response = await fetch(`${this.baseURL}/health`, { method: 'GET' });
            if (response.ok) {
                const data = await response.json();
                this.isOnline = data.status === 'online';
                if (this.isOnline) console.log('✅ API server is online with MongoDB');
            } else {
                this.isOnline = false;
                console.log('❌ API response not OK');
            }
        } catch (error) {
            this.isOnline = false;
            console.log('❌ API server not available, using offline mode');
        }
    }

    async request(endpoint, options = {}) {
        if (!this.isOnline) throw new Error('API server offline');
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                headers: { 'Content-Type': 'application/json', ...options.headers },
                ...options,
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // ===== Players API =====
    async getPlayers() {
        const result = await this.request('/players');
        return result.players;
    }
    async addPlayer(player) {
        const result = await this.request('/players', { method: 'POST', body: JSON.stringify(player) });
        return result.player;
    }
    async updatePlayer(id, updates) {
        const result = await this.request('/players', { method: 'PUT', body: JSON.stringify({ id, ...updates }) });
        return result.player;
    }
    async deletePlayer(id) {
        await this.request(`/players?id=${id}`, { method: 'DELETE' });
    }

    // ===== Fixtures API =====
    async getFixtures() {
        const result = await this.request('/fixtures');
        return result.fixtures;
    }
    async addFixture(fixture) {
        const result = await this.request('/fixtures', { method: 'POST', body: JSON.stringify(fixture) });
        return result.fixture;
    }
    async updateFixture(id, updates) {
        const result = await this.request('/fixtures', { method: 'PUT', body: JSON.stringify({ id, ...updates }) });
        return result.fixture;
    }
    async deleteFixture(id) {
        await this.request(`/fixtures?id=${id}`, { method: 'DELETE' });
    }

    // ===== Results API =====
    async getResults() {
        const result = await this.request('/results');
        return result.results;
    }
    async addResult(resultData) {
        const result = await this.request('/results', { method: 'POST', body: JSON.stringify(resultData) });
        return result.result;
    }
    async updateResult(id, updates) {
        const result = await this.request('/results', { method: 'PUT', body: JSON.stringify({ id, ...updates }) });
        return result.result;
    }
    async deleteResult(id) {
        await this.request(`/results?id=${id}`, { method: 'DELETE' });
    }

    // ===== All Data =====
    async getAllData() {
        return await this.request('/data');
    }

    // ===== Initialize DB =====
    async initializeDatabase() {
        return await this.request('/initialize', { method: 'POST' });
    }
}

// Create global API instance
const eflAPI = new EFLAPI();


// =======================================================
// 🔔 DARK TOAST SYSTEM (for all notifications)
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
    div.innerHTML = `<i class="fas fa-info-circle me-2" style="color:${colors[type]};"></i>${message}`;

    document.body.appendChild(div);

    setTimeout(() => {
        div.style.opacity = '0';
        div.style.transform = 'translateY(-10px)';
        setTimeout(() => div.remove(), 300);
    }, 4000);
}


// =======================================================
// 🔄 DATA SYNC SYSTEM
// =======================================================
class DataSync {
    constructor() {
        this.lastUpdate = localStorage.getItem('efl_last_sync') || null;
        this.syncInterval = null;
        this.isSyncing = false;
    }

    startAutoSync() {
        // Run every 5 hours (18,000,000 ms)
        this.syncInterval = setInterval(() => this.syncData(), 18000000);
        console.log('🔄 Auto-sync started (5-hour intervals)');
        this.syncData(); // run once on load
    }

    stopAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }

    async syncData(manual = false) {
        if (!eflAPI.isOnline || this.isSyncing) {
            if (manual) showNotification('⚠️ Server offline. Cannot sync.', 'error');
            return;
        }

        this.isSyncing = true;
        if (manual) showNotification('🔄 Syncing with server...', 'info');

        try {
            const remoteData = await eflAPI.getAllData();
            const localVersion = localStorage.getItem('efl_data_version');
            const remoteVersion = remoteData.lastUpdate;

            if (!localVersion || new Date(remoteVersion) > new Date(localVersion)) {
                console.log('🔁 Updating local data...');
                localStorage.setItem(DB_KEYS.PLAYERS, JSON.stringify(remoteData.players));
                localStorage.setItem(DB_KEYS.FIXTURES, JSON.stringify(remoteData.fixtures));
                localStorage.setItem(DB_KEYS.RESULTS, JSON.stringify(remoteData.results));
                localStorage.setItem('efl_data_version', remoteVersion);
                localStorage.setItem('efl_last_sync', new Date().toISOString());

                showNotification('✅ Data synced successfully!', 'success');
                if (typeof window.currentTab === 'string') showTab(window.currentTab);
            } else {
                if (manual) showNotification('✅ Data already up to date.', 'success');
            }
        } catch (error) {
            console.error('Sync failed:', error);
            if (manual) showNotification('❌ Sync failed. Please try again.', 'error');
        } finally {
            this.isSyncing = false;
        }
    }

    async manualSync() {
        if (typeof checkAdminAuth === 'function' && checkAdminAuth()) {
            await this.syncData(true);
        } else {
            showNotification('⚠️ Only admin can trigger manual sync.', 'warning');
        }
    }
}

const dataSync = new DataSync();


// =======================================================
// 🌐 CONNECTION STATUS HANDLER
// =======================================================
function updateSyncStatus() {
    const statusElement = document.getElementById('sync-status');
    if (!statusElement) return;
    if (eflAPI.isOnline) {
        statusElement.innerHTML = '<i class="fas fa-cloud me-1"></i>Online';
        statusElement.className = 'badge bg-success';
    } else {
        statusElement.innerHTML = '<i class="fas fa-cloud me-1"></i>Offline';
        statusElement.className = 'badge bg-danger';
    }
}


// =======================================================
// ⚙️ EVENT HANDLERS
// =======================================================
document.addEventListener('DOMContentLoaded', () => {
    // Update connection status every 30 minutes
    setInterval(() => {
        eflAPI.checkConnection();
        updateSyncStatus();
    }, 1800000);

    // Initial check & auto-sync
    setTimeout(() => {
        eflAPI.checkConnection();
        updateSyncStatus();
        dataSync.startAutoSync();
    }, 3000);

    // Manual sync button (admin only)
    const syncBtn = document.getElementById('manual-sync-btn');
    if (syncBtn) {
        syncBtn.addEventListener('click', () => dataSync.manualSync());
    }
});
