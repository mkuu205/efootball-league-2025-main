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
            const response = await fetch(`${this.baseURL}/health`, { 
                method: 'GET'
            });
            
            if (response.ok) {
                const data = await response.json();
                this.isOnline = data.status === 'online';
                
                if (this.isOnline) {
                    console.log('✅ API server is online with MongoDB');
                }
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
        if (!this.isOnline) {
            throw new Error('API server offline');
        }

        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
                ...options,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Players API
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
        await this.request(`/players?id=${id}`, {
            method: 'DELETE',
        });
    }

    // Fixtures API
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
        await this.request(`/fixtures?id=${id}`, {
            method: 'DELETE',
        });
    }

    // Results API
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
        await this.request(`/results?id=${id}`, {
            method: 'DELETE',
        });
    }

    // Get all data
    async getAllData() {
        return await this.request('/data');
    }

    // Initialize with sample data
    async initializeDatabase() {
        return await this.request('/initialize', {
            method: 'POST',
        });
    }
}

// Create global API instance
const eflAPI = new EFLAPI();

// Real-time synchronization - UPDATED FOR 5 HOUR INTERVALS
class DataSync {
    constructor() {
        this.lastUpdate = localStorage.getItem('efl_last_sync') || null;
        this.syncInterval = null;
        this.isSyncing = false;
    }

    startAutoSync() {
        // Check for updates every 5 hours (18,000,000 milliseconds)
        this.syncInterval = setInterval(() => {
            this.syncData();
        }, 18000000); // 5 hours in milliseconds
        
        console.log('🔄 Auto-sync started (5 hour intervals)');
    }

    stopAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }

    async syncData() {
        if (!eflAPI.isOnline || this.isSyncing) return;

        this.isSyncing = true;
        
        try {
            const remoteData = await eflAPI.getAllData();
            const localVersion = localStorage.getItem('efl_data_version');
            const remoteVersion = remoteData.lastUpdate;

            if (!localVersion || new Date(remoteVersion) > new Date(localVersion)) {
                console.log('🔄 New data detected after 5 hours, syncing...');
                
                // Update local storage with remote data
                localStorage.setItem(DB_KEYS.PLAYERS, JSON.stringify(remoteData.players));
                localStorage.setItem(DB_KEYS.FIXTURES, JSON.stringify(remoteData.fixtures));
                localStorage.setItem(DB_KEYS.RESULTS, JSON.stringify(remoteData.results));
                localStorage.setItem('efl_data_version', remoteVersion);
                localStorage.setItem('efl_last_sync', new Date().toISOString());

                // Refresh UI if needed
                this.notifyUpdate();
            }
        } catch (error) {
            console.log('Sync failed:', error);
        } finally {
            this.isSyncing = false;
        }
    }

    notifyUpdate() {
        // Show subtle update notification
        const existingNotification = document.getElementById('sync-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.id = 'sync-notification';
        notification.className = 'alert alert-info alert-dismissible fade show';
        notification.style.cssText = 'position: fixed; top: 80px; right: 20px; z-index: 1000; min-width: 250px;';
        notification.innerHTML = `
            <i class="fas fa-sync me-2"></i>Data updated automatically (5-hour sync)
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);

        // Refresh current view
        if (typeof window.currentTab === 'string') {
            showTab(window.currentTab);
        }
    }

    // Manual sync trigger
    async manualSync() {
        if (!eflAPI.isOnline) {
            showNotification('Server is offline. Cannot sync.', 'error');
            return;
        }

        showNotification('Syncing with server...', 'info');
        
        try {
            await this.syncData();
            showNotification('Sync completed successfully!', 'success');
        } catch (error) {
            showNotification('Sync failed: ' + error.message, 'error');
        }
    }
}

// Create global sync instance
const dataSync = new DataSync();

// Update sync status display
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

// Start auto-sync when page loads - UPDATED FOR 5 HOUR INTERVALS
document.addEventListener('DOMContentLoaded', function() {
    // Update connection status every 30 minutes (less frequent checks)
    setInterval(() => {
        eflAPI.checkConnection();
        updateSyncStatus();
    }, 1800000); // 30 minutes in milliseconds
    
    // Initial status update
    setTimeout(() => {
        eflAPI.checkConnection();
        updateSyncStatus();
        dataSync.startAutoSync(); // Start 5-hour auto-sync
    }, 5000);
});