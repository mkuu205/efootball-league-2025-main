// Database and Data Management System with Supabase
console.log('🚀 database.js STARTED loading...');

// Database table keys
export const DB_KEYS = {
    PLAYERS: 'players',
    FIXTURES: 'fixtures',
    RESULTS: 'results',
    ADMIN_CONFIG: 'admin_config'
};

// Default players data
export const DEFAULT_PLAYERS = [
    { 
        id: 1, 
        name: 'alwaysresistance', 
        team: 'Kenya', 
        photo: 'https://i.ibb.co/0jmt3HXf/alwaysresistance.jpg', 
        strength: 3138
    },
    { 
        id: 2, 
        name: 'lildrip035', 
        team: 'Chelsea', 
        photo: 'https://i.ibb.co/CcXdyfc/lildrip035.jpg',
        strength: 3100
    },
    { 
        id: 3, 
        name: 'Sergent white', 
        team: 'Chelsea', 
        photo: 'https://i.ibb.co/TD6HHksv/sergent-white.jpg', 
        strength: 3042
    },
    { 
        id: 4, 
        name: 'skangaKe254', 
        team: 'Liverpool', 
        photo: 'https://i.ibb.co/Wv5nbZRy/skanga-Ke254.jpg', 
        strength: 2700
    },
    { 
        id: 5, 
        name: 'Drexas', 
        team: 'Everton', 
        photo: 'https://i.ibb.co/2mzRJVn/drexas.jpg', 
        strength: 2792
    },
    { 
        id: 6, 
        name: 'Collo leevan', 
        team: 'Manchester United', 
        photo: 'https://i.ibb.co/nqyFvzvf/collo-leevan.jpg', 
        strength: 2448
    },
    { 
        id: 7, 
        name: 'captainkenn', 
        team: 'West Ham', 
        photo: 'https://i.ibb.co/35kMmxjW/captainkenn.jpg', 
        strength: 3110
    },
    { 
        id: 8,
        name: 'Bora kesho',
        team: 'Manchester United',
        photo: 'https://i.ibb.co/7NXyjhWR/Bora-20kesho.jpg',
        strength: 3177
    }
];

// Supabase Client Initialization
const SUPABASE_URL = 'https://zliedzrqzvywlsyfggcq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsaWVkenJxenZ5d2xzeWZnZ2NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwOTE4NjYsImV4cCI6MjA3NjY2Nzg2Nn0.NbzEZ4ievehtrlyOxCK_mheb7YU4SnNgC0uXuOKPNOI';

export let supabase;

try {
    // Create Supabase client
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase client initialized successfully');
} catch (error) {
    console.error('❌ Supabase client initialization failed:', error);
    supabase = null;
}

// Core Database Functions
export async function getData(tableName) {
    if (!supabase) {
        console.error('Supabase not available for getData');
        return [];
    }
    try {
        const { data, error } = await supabase.from(tableName).select('*');
        if (error) {
            console.error(`Error getting ${tableName}:`, error);
            return [];
        }
        return data || [];
    } catch (err) {
        console.error(`Error in getData for ${tableName}:`, err);
        return [];
    }
}

export async function saveData(tableName, data) {
    if (!supabase) {
        console.error('Supabase not available for saveData');
        return [];
    }
    try {
        if (Array.isArray(data) && data.length > 0) {
            const { data: result, error } = await supabase.from(tableName).insert(data).select();
            if (error) throw error;
            return result;
        } else {
            const { data: result, error } = await supabase.from(tableName).upsert(data).select();
            if (error) throw error;
            return result;
        }
    } catch (error) {
        console.error(`Error saving to ${tableName}:`, error);
        throw error;
    }
}

// Initialize database
export async function initializeDatabase() {
    console.log('⚙️ Initializing Supabase database...');
    if (!supabase) {
        console.error('Cannot initialize database: Supabase not available');
        return;
    }

    try {
        // Initialize players
        const existingPlayers = await getData(DB_KEYS.PLAYERS);
        if (!existingPlayers || existingPlayers.length === 0) {
            console.log('Setting up default players in Supabase...');
            const insertedPlayers = await saveData(DB_KEYS.PLAYERS, DEFAULT_PLAYERS);
            console.log(`✅ Default players inserted: ${insertedPlayers ? insertedPlayers.length : 0}`);
        } else {
            console.log(`✅ Players already initialized with ${existingPlayers.length} players`);
        }

        // Generate fixtures if none exist
        const existingFixtures = await getData(DB_KEYS.FIXTURES);
        if (!existingFixtures || existingFixtures.length === 0) {
            await generateSampleFixtures();
        }

    } catch (error) {
        console.error('Database initialization failed:', error);
    }
}

// Generate sample fixtures
async function generateSampleFixtures() {
    const players = await getData(DB_KEYS.PLAYERS);
    if (!players || players.length < 2) return;

    const fixtures = [];
    let fixtureId = 1;
    const startDate = new Date();

    // Generate all possible match pairs
    for (let i = 0; i < players.length; i++) {
        for (let j = i + 1; j < players.length; j++) {
            const matchDate = new Date(startDate);
            matchDate.setDate(matchDate.getDate() + fixtureId);

            fixtures.push({
                id: fixtureId++,
                home_player_id: players[i].id,
                away_player_id: players[j].id,
                date: matchDate.toISOString().split('T')[0],
                time: '15:00',
                venue: 'Virtual Stadium ' + String.fromCharCode(65 + (fixtureId % 3)),
                played: false
            });
        }
    }

    try {
        await saveData(DB_KEYS.FIXTURES, fixtures);
        console.log('✅ Generated', fixtures.length, 'fixtures');
    } catch (error) {
        console.error('Error generating fixtures:', error);
    }
}

// Player Management
export async function addPlayer(playerData) {
    const players = await getData(DB_KEYS.PLAYERS);
    const maxId = players.length > 0 ? Math.max(...players.map(p => p.id || 0)) : 0;
    
    const newPlayer = {
        ...playerData,
        id: maxId + 1,
        photo: playerData.photo || `https://via.placeholder.com/100/1a1a2e/ffffff?text=${playerData.name.charAt(0)}`
    };

    const inserted = await saveData(DB_KEYS.PLAYERS, [newPlayer]);
    console.log('Player added:', newPlayer.name);
    await refreshAllDisplays();
    return inserted[0];
}

export async function updatePlayer(player) {
    if (!supabase) return null;
    try {
        const { data, error } = await supabase
            .from(DB_KEYS.PLAYERS)
            .update(player)
            .eq('id', player.id)
            .select();
            
        if (error) throw error;
        await refreshAllDisplays();
        return data[0];
    } catch (err) {
        console.error('Error updating player:', err);
        throw err;
    }
}

// Fixture Management
export async function addFixture(fixture) {
    const fixtures = await getData(DB_KEYS.FIXTURES);
    const maxId = fixtures.length > 0 ? Math.max(...fixtures.map(f => f.id || 0)) : 0;
    
    const newFixture = {
        ...fixture,
        id: maxId + 1
    };
    
    return await saveData(DB_KEYS.FIXTURES, [newFixture]);
}

// Result Management
export async function addResult(result) {
    const results = await getData(DB_KEYS.RESULTS);
    const maxId = results.length > 0 ? Math.max(...results.map(r => r.id || 0)) : 0;
    
    const newResult = {
        ...result,
        id: maxId + 1
    };
    
    const inserted = await saveData(DB_KEYS.RESULTS, [newResult]);
    
    // Mark corresponding fixture as played
    const fixtures = await getData(DB_KEYS.FIXTURES);
    const fixture = fixtures.find(f => 
        f.home_player_id === result.home_player_id && 
        f.away_player_id === result.away_player_id
    );
    
    if (fixture) {
        await updateFixture({ ...fixture, played: true });
    }
    
    await refreshAllDisplays();
    return inserted[0];
}

export async function updateFixture(fixture) {
    if (!supabase) return null;
    const { data, error } = await supabase
        .from(DB_KEYS.FIXTURES)
        .update(fixture)
        .eq('id', fixture.id)
        .select();
        
    if (error) throw error;
    await refreshAllDisplays();
    return data[0];
}

// Helper Functions
export async function getPlayerById(playerId) {
    const players = await getData(DB_KEYS.PLAYERS);
    return players.find(p => p.id === playerId);
}

export function getDefaultStats() {
    return { 
        played: 0, 
        wins: 0, 
        draws: 0, 
        losses: 0, 
        goalsFor: 0, 
        goalsAgainst: 0, 
        goalDifference: 0, 
        points: 0 
    };
}

// Statistics
export async function calculatePlayerStats(playerId) {
    try {
        const results = await getData(DB_KEYS.RESULTS);
        const playerResults = results.filter(r => 
            r && (r.home_player_id === playerId || r.away_player_id === playerId)
        );

        let stats = getDefaultStats();
        
        playerResults.forEach(result => {
            if (!result) return;
            
            const isHome = result.home_player_id === playerId;
            const playerScore = isHome ? (result.home_score || 0) : (result.away_score || 0);
            const opponentScore = isHome ? (result.away_score || 0) : (result.home_score || 0);

            stats.played++;
            stats.goalsFor += playerScore;
            stats.goalsAgainst += opponentScore;

            if (playerScore > opponentScore) {
                stats.wins++;
                stats.points += 3;
            } else if (playerScore === opponentScore) {
                stats.draws++;
                stats.points += 1;
            } else {
                stats.losses++;
            }
        });

        stats.goalDifference = stats.goalsFor - stats.goalsAgainst;
        return stats;
    } catch (error) {
        console.error('Error calculating player stats:', error);
        return getDefaultStats();
    }
}

export async function getLeagueTable() {
    try {
        const players = await getData(DB_KEYS.PLAYERS);
        const tableData = await Promise.all(players.map(async p => {
            const stats = await calculatePlayerStats(p.id);
            return { ...p, ...stats };
        }));
        
        return tableData.sort((a, b) => 
            b.points - a.points || 
            b.goalDifference - a.goalDifference || 
            b.goalsFor - a.goalsFor
        );
    } catch (error) {
        console.error('Error generating league table:', error);
        return [];
    }
}

// Refresh UI
export async function refreshAllDisplays() {
    try {
        console.log('Refreshing all displays...');
        
        // Refresh admin displays if on admin page
        if (window.location.pathname.includes('admin.html')) {
            if (typeof window.renderAdminPlayers === 'function') {
                await window.renderAdminPlayers();
            }
            if (typeof window.renderAdminFixtures === 'function') {
                await window.renderAdminFixtures();
            }
            if (typeof window.renderAdminResults === 'function') {
                await window.renderAdminResults();
            }
            if (typeof window.populatePlayerSelects === 'function') {
                await window.populatePlayerSelects();
            }
            if (typeof window.updateAdminStatistics === 'function') {
                await window.updateAdminStatistics();
            }
        }
        
        showNotification('Data refreshed successfully!', 'success');
    } catch (error) {
        console.error('Error refreshing displays:', error);
        showNotification('Error refreshing data', 'error');
    }
}

// Data Management
export async function exportTournamentData() {
    try {
        const players = await getData(DB_KEYS.PLAYERS);
        const fixtures = await getData(DB_KEYS.FIXTURES);
        const results = await getData(DB_KEYS.RESULTS);
        
        const data = {
            players,
            fixtures,
            results,
            exportDate: new Date().toISOString(),
            tournament: 'eFootball League 2025'
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `efootball_tournament_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('Tournament data exported successfully!', 'success');
        return data;
    } catch (error) {
        console.error('Error exporting tournament data:', error);
        showNotification('Error exporting data: ' + error.message, 'error');
        throw error;
    }
}

export async function resetTournament() {
    if (!confirm('Are you sure you want to reset the entire tournament? This will delete ALL data including players, fixtures, and results. This cannot be undone.')) {
        return false;
    }
    
    try {
        // Delete all data
        await supabase.from(DB_KEYS.RESULTS).delete().neq('id', 0);
        await supabase.from(DB_KEYS.FIXTURES).delete().neq('id', 0);
        await supabase.from(DB_KEYS.PLAYERS).delete().neq('id', 0);
        
        // Reinitialize with default data
        await initializeDatabase();
        
        await refreshAllDisplays();
        showNotification('Tournament reset successfully!', 'success');
        return true;
    } catch (error) {
        console.error('Error resetting tournament:', error);
        showNotification('Error resetting tournament', 'error');
        return false;
    }
}

// Data Sync System
export class DataSync {
    constructor() {
        this.lastUpdate = localStorage.getItem('efl_last_sync') || null;
    }

    async manualSync() {
        showNotification('🔄 Refreshing data from Supabase...', 'info');
        
        try {
            await refreshAllDisplays();
            this.lastUpdate = new Date().toISOString();
            localStorage.setItem('efl_last_sync', this.lastUpdate);
            showNotification('✅ Data refreshed successfully!', 'success');
        } catch (error) {
            console.error('Sync failed:', error);
            showNotification('❌ Sync failed. Please try again.', 'error');
        }
    }
}

// Create global data sync instance
export const dataSync = new DataSync();

// Utilities
export function showNotification(message, type = 'info') {
    if (typeof document === 'undefined') return;
    
    // Remove any existing notifications first
    const existingNotifications = document.querySelectorAll('.custom-notification');
    existingNotifications.forEach(notification => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    });
    
    const notification = document.createElement('div');
    notification.className = `custom-notification alert alert-${type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = `
        top: 20px; 
        right: 20px; 
        z-index: 1060; 
        min-width: 300px; 
        max-width: 400px;
        background: ${type === 'success' ? '#198754' : type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#0dcaf0'};
        color: white;
        border: none;
    `;
    notification.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'} me-2"></i>
            <span>${message}</span>
        </div>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => { 
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
}

// Make functions globally available
window.refreshAllDisplays = refreshAllDisplays;
window.exportTournamentData = exportTournamentData;
window.resetTournament = resetTournament;
window.dataSync = dataSync;

// Initialize Database on DOM Loaded
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', async function() {
        console.log('📦 DOM loaded, initializing database...');
        
        if (!supabase) {
            console.error('❌ Supabase not available');
            showNotification('❌ Database connection failed. Please refresh the page.', 'error');
            return;
        }
        
        try {
            await initializeDatabase();
            console.log('✅ Supabase database system initialized');
            
            // Update sync status display
            const syncStatus = document.getElementById('sync-status');
            if (syncStatus) {
                syncStatus.innerHTML = '<i class="fas fa-cloud me-1"></i>Supabase Online';
                syncStatus.className = 'badge bg-success';
            }
            
        } catch (error) {
            console.error('Database initialization error:', error);
            showNotification('❌ Database initialization failed', 'error');
        }
    });
}

console.log('✅ database.js COMPLETED loading');
