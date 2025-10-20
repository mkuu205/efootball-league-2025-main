// API Service for eFootball League - Render Version
const API_BASE_URL = '/api';

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

    // === Players API ===
    async getPlayers() {
        const result = await this.request('/players');
        return result.players;
    }

    async addPlayer(player) {
        const result = await this.request('/players', {
            method: 'POST',
            body: JSON.stringify(player),
        });
        return result.player;
    }

    async updatePlayer(id, updates) {
        const result = await this.request('/players', {
            method: 'PUT',
            body: JSON.stringify({ id, ...updates }),
        });
        return result.player;
    }

    async deletePlayer(id) {
        await this.request(`/players?id=${id}`, { method: 'DELETE' });
    }

    // === Fixtures API ===
    async getFixtures() {
        const result = await this.request('/fixtures');
        return result.fixtures;
    }

    async addFixture(fixture) {
        const result = await this.request('/fixtures', {
            method: 'POST',
            body: JSON.stringify(fixture),
        });
        return result.fixture;
    }

    async updateFixture(id, updates) {
        const result = await this.request('/fixtures', {
            method: 'PUT',
            body: JSON.stringify({ id, ...updates }),
        });
        return result.fixture;
    }

    async deleteFixture(id) {
        await this.request(`/fixtures?id=${id}`, { method: 'DELETE' });
    }

    // === Results API ===
    async getResults() {
        const result = await this.request('/results');
        return result.results;
    }

    async addResult(resultData) {
        const result = await this.request('/results', {
            method: 'POST',
            body: JSON.stringify(resultData),
        });
        return result.result;
    }

    async updateResult(id, updates) {
        const result = await this.request('/results', {
            method: 'PUT',
            body: JSON.stringify({ id, ...updates }),
        });
        return result.result;
    }

    async deleteResult(id) {
        await this.request(`/results?id=${id}`, { method: 'DELETE' });
    }

    // === All Data ===
    async getAllData() {
        return await this.request('/data');
    }

    async initializeDatabase() {
        return await this.request('/initialize', { method: 'POST' });
    }
}

// === Global API instance ===
const eflAPI = new EFLAPI();


// === Enhanced DataSync Class ===
class DataSync {
    constructor(isAdmin = false) {
        this.isAdmin = isAdmin;
        this.lastUpdate = localStorage.getItem('efl_last_sync') || null;
        this.syncInterval = null;
        this.isSyncing = false;
    }

    async syncData() {
        if (!eflAPI.isOnline || this.isSyncing) return;

        this.isSyncing = true;
        try {
            const remoteData = await eflAPI.getAllData();
            const localVersion = localStorage.getItem('efl_data_version');
            const remoteVersion = remoteData.lastUpdate;

            if (!localVersion || new Date(remoteVersion) > new Date(localVersion)) {
                console.log('🔄 Syncing new data...');

                localStorage.setItem(DB_KEYS.PLAYERS, JSON.stringify(remoteData.players));
                localStorage.setItem(DB_KEYS.FIXTURES, JSON.stringify(remoteData.fixtures));
                localStorage.setItem(DB_KEYS.RESULTS, JSON.stringify(remoteData.results));
                localStorage.setItem('efl_data_version', remoteVersion);
                localStorage.setItem('efl_last_sync', new Date().toISOString());

                this.notifyUpdate();
            }
        } catch (error) {
            console.log('Sync failed:', error);
        } finally {
            this.isSyncing = false;
        }
    }

    startAutoSync() {
        if (this.isAdmin) return; // Admin does not auto-sync
        this.syncData(); // run immediately
        this.syncInterval = setInterval(() => this.syncData(), 300000); // every 5 min
        console.log('🔄 Auto-sync active (users only, every 5 min)');
    }

    stopAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }

    notifyUpdate() {
        const existing = document.getElementById('sync-notification');
        if (existing) existing.remove();

        const note = document.createElement('div');
        note.id = 'sync-notification';
        note.className = 'alert alert-info alert-dismissible fade show';
        note.style.cssText = 'position: fixed; top: 80px; right: 20px; z-index: 1000; min-width: 250px;';
        note.innerHTML = `
            <i class="fas fa-sync me-2"></i> Data synced successfully
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(note);
        setTimeout(() => note.remove(), 4000);

        if (typeof window.currentTab === 'string') {
            showTab(window.currentTab);
        }
    }

    async manualSync() {
        if (!eflAPI.isOnline) {
            showNotification('Server is offline. Cannot sync.', 'error');
            return;
        }

        showNotification('Syncing with server...', 'info');
        try {
            await this.syncData();
            showNotification('✅ Sync completed successfully!', 'success');
        } catch (error) {
            showNotification('❌ Sync failed: ' + error.message, 'error');
        }
    }

    attachManualSyncButton() {
        if (!this.isAdmin) return;
        const existing = document.getElementById('manual-sync-btn');
        if (existing) return;

        const btn = document.createElement('button');
        btn.id = 'manual-sync-btn';
        btn.className = 'btn btn-warning position-fixed';
        btn.style.cssText = 'top: 80px; left: 20px; z-index: 1000;';
        btn.innerHTML = `<i class="fas fa-sync-alt me-2"></i>Sync Updates`;

        btn.onclick = () => this.manualSync();

        document.body.appendChild(btn);
    }
}

// === Global sync instance ===
// Change this line depending on page:
const isAdminPage = window.location.pathname.includes('admin.html');
const dataSync = new DataSync(isAdminPage);


// === Connection status ===
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


// === Initialization ===
document.addEventListener('DOMContentLoaded', function() {
    // Update connection every 30 mins
    setInterval(() => {
        eflAPI.checkConnection();
        updateSyncStatus();
    }, 1800000);

    // Initial setup
    setTimeout(() => {
        eflAPI.checkConnection();
        updateSyncStatus();

        if (isAdminPage) {
            dataSync.attachManualSyncButton();
            console.log('👑 Admin mode → Manual sync only');
        } else {
            dataSync.startAutoSync();
        }
    }, 3000);
});
