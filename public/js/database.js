// Online Database Manager - No Local Storage
const DB_KEYS = {
    PLAYERS: 'players',
    FIXTURES: 'fixtures',
    RESULTS: 'results'
};

// Default balanced teams configuration
const BALANCED_TEAMS = [
    { name: 'Kenya', strength: 85, color: '#000000' },
    { name: 'Chelsea', strength: 88, color: '#034694' },
    { name: 'Liverpool', strength: 87, color: '#c8102e' },
    { name: 'Everton', strength: 78, color: '#003399' },
    { name: 'Manchester United', strength: 85, color: '#da291c' },
    { name: 'West Ham', strength: 79, color: '#7c2c3b' },
    { name: 'Arsenal', strength: 86, color: '#ef0107' },
    { name: 'Manchester City', strength: 89, color: '#6caddf' },
    { name: 'Tottenham', strength: 84, color: '#132257' },
    { name: 'Newcastle', strength: 82, color: '#241f20' }
];

// Initialize online database
async function initializeDatabase() {
    console.log('⚙️ Initializing online database...');
    
    try {
        // Check if we can connect to the API
        await eflAPI.checkConnection();
        console.log('✅ Online database initialized');
        return true;
    } catch (error) {
        console.error('❌ Failed to initialize online database:', error);
        showNotification('Cannot connect to server. Please check your connection.', 'error');
        return false;
    }
}

// Data management functions - Now all async and online-only
async function getData(key) {
    try {
        console.log(`📡 Fetching ${key} from server...`);
        
        switch (key) {
            case DB_KEYS.PLAYERS:
                return await eflAPI.getPlayers();
            case DB_KEYS.FIXTURES:
                return await eflAPI.getFixtures();
            case DB_KEYS.RESULTS:
                return await eflAPI.getResults();
            default:
                console.warn(`Unknown data key: ${key}`);
                return [];
        }
    } catch (error) {
        console.error(`Error getting ${key}:`, error);
        showNotification(`Error loading ${key}: ${error.message}`, 'error');
        return [];
    }
}

async function getPlayerById(playerId) {
    try {
        const players = await getData(DB_KEYS.PLAYERS);
        return players.find(p => p && p.id === playerId);
    } catch (error) {
        console.error('Error getting player by ID:', error);
        return null;
    }
}

async function getFixtureById(fixtureId) {
    try {
        const fixtures = await getData(DB_KEYS.FIXTURES);
        return fixtures.find(f => f && f.id === fixtureId);
    } catch (error) {
        console.error('Error getting fixture by ID:', error);
        return null;
    }
}

async function getResultById(resultId) {
    try {
        const results = await getData(DB_KEYS.RESULTS);
        return results.find(r => r && r.id === resultId);
    } catch (error) {
        console.error('Error getting result by ID:', error);
        return null;
    }
}

// ✅ Refresh all displays
async function refreshAllDisplays() {
    console.log('🔄 Refreshing all displays from server...');
    
    try {
        // Force refresh by clearing any cached data
        if (typeof eflAPI !== 'undefined' && eflAPI.clearCache) {
            eflAPI.clearCache();
        }
        
        if (typeof renderLeagueTable === 'function') await renderLeagueTable();
        if (typeof renderPlayers === 'function') await renderPlayers();
        if (typeof renderHomePage === 'function') await renderHomePage();
        if (typeof renderFixtures === 'function') await renderFixtures();
        if (typeof renderResults === 'function') await renderResults();
        
        if (typeof renderAdminPlayers === 'function') await renderAdminPlayers();
        if (typeof renderAdminFixtures === 'function') await renderAdminFixtures();
        if (typeof renderAdminResults === 'function') await renderAdminResults();
        if (typeof populatePlayerSelects === 'function') await populatePlayerSelects();
        
        if (typeof advancedStats !== 'undefined' && typeof advancedStats.loadAdvancedStatsDashboard === 'function') {
            await advancedStats.loadAdvancedStatsDashboard();
        }
        
        console.log('✅ All displays refreshed from server');
    } catch (error) {
        console.error('Error refreshing displays:', error);
        showNotification('Error refreshing data: ' + error.message, 'error');
    }
}

// Player management functions - Now fully online
async function addPlayer(playerData) {
    try {
        console.log('👤 Adding player online:', playerData.name);
        
        // Validate player data
        if (!playerData.name || !playerData.team) {
            throw new Error('Player name and team are required');
        }

        // Check for duplicates via API
        const existingPlayers = await eflAPI.getPlayers();
        const isDuplicate = existingPlayers.some(player => 
            player.name.toLowerCase() === playerData.name.toLowerCase() &&
            player.team.toLowerCase() === playerData.team.toLowerCase()
        );
        
        if (isDuplicate) {
            throw new Error(`Player "${playerData.name}" already exists in team ${playerData.team}`);
        }
        
        // Add timestamps
        const playerWithTimestamps = {
            ...playerData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Save directly to API
        const newPlayer = await eflAPI.addPlayer(playerWithTimestamps);
        
        // Refresh all displays to show the new player immediately
        await refreshAllDisplays();
        
        console.log('✅ Player added online:', newPlayer.name, '(ID:', newPlayer.id + ')');
        showNotification('Player added successfully!', 'success');
        return newPlayer;
    } catch (error) {
        console.error('❌ Error adding player:', error);
        showNotification('Error adding player: ' + error.message, 'error');
        throw error;
    }
}

async function updatePlayer(updatedPlayer) {
    try {
        console.log('✏️ Updating player online:', updatedPlayer.name);
        
        if (!updatedPlayer.id) {
            throw new Error('Player ID is required for update');
        }

        updatedPlayer.updatedAt = new Date().toISOString();
        
        // Update directly via API
        const result = await eflAPI.updatePlayer(updatedPlayer.id, updatedPlayer);
        
        // Refresh displays
        await refreshAllDisplays();
        
        console.log('✅ Player updated online:', updatedPlayer.name);
        showNotification('Player updated successfully!', 'success');
        return result;
    } catch (error) {
        console.error('❌ Error updating player:', error);
        showNotification('Error updating player: ' + error.message, 'error');
        throw error;
    }
}

async function deletePlayer(playerId) {
    try {
        console.log('🗑️ Deleting player online:', playerId);
        
        if (!playerId) {
            throw new Error('Player ID is required for deletion');
        }

        // Delete directly via API
        await eflAPI.deletePlayer(playerId);
        
        // Refresh displays
        await refreshAllDisplays();
        
        console.log('✅ Player deleted online:', playerId);
        showNotification('Player deleted successfully!', 'success');
        return true;
    } catch (error) {
        console.error('❌ Error deleting player:', error);
        showNotification('Error deleting player: ' + error.message, 'error');
        throw error;
    }
}

// Fixture management functions - Now fully online
async function addFixture(fixtureData) {
    try {
        console.log('📅 Adding fixture online');
        
        const fixtureWithTimestamps = {
            ...fixtureData,
            played: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Save directly to API
        const newFixture = await eflAPI.addFixture(fixtureWithTimestamps);
        
        // Refresh displays
        await refreshAllDisplays();
        
        console.log('✅ Fixture added online:', newFixture.id);
        showNotification('Fixture added successfully!', 'success');
        return newFixture;
    } catch (error) {
        console.error('❌ Error adding fixture:', error);
        showNotification('Error adding fixture: ' + error.message, 'error');
        throw error;
    }
}

async function updateFixture(updatedFixture) {
    try {
        console.log('✏️ Updating fixture online:', updatedFixture.id);
        
        if (!updatedFixture.id) {
            throw new Error('Fixture ID is required for update');
        }

        updatedFixture.updatedAt = new Date().toISOString();
        
        // Update directly via API
        const result = await eflAPI.updateFixture(updatedFixture.id, updatedFixture);
        
        // Refresh displays
        await refreshAllDisplays();
        
        console.log('✅ Fixture updated online:', updatedFixture.id);
        showNotification('Fixture updated successfully!', 'success');
        return result;
    } catch (error) {
        console.error('❌ Error updating fixture:', error);
        showNotification('Error updating fixture: ' + error.message, 'error');
        throw error;
    }
}

async function deleteFixture(fixtureId) {
    try {
        console.log('🗑️ Deleting fixture online:', fixtureId);
        
        if (!fixtureId) {
            throw new Error('Fixture ID is required for deletion');
        }

        // Delete directly via API
        await eflAPI.deleteFixture(fixtureId);
        
        // Refresh displays
        await refreshAllDisplays();
        
        console.log('✅ Fixture deleted online:', fixtureId);
        showNotification('Fixture deleted successfully!', 'success');
        return true;
    } catch (error) {
        console.error('❌ Error deleting fixture:', error);
        showNotification('Error deleting fixture: ' + error.message, 'error');
        throw error;
    }
}

// Result management functions - Now fully online
async function addResult(resultData) {
    try {
        console.log('⚽ Adding result online');
        
        const resultWithTimestamps = {
            ...resultData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Save directly to API
        const newResult = await eflAPI.addResult(resultWithTimestamps);
        
        // Also mark fixture as played
        const fixtures = await getData(DB_KEYS.FIXTURES);
        const fixture = fixtures.find(f => 
            f.homePlayerId === resultData.homePlayerId && 
            f.awayPlayerId === resultData.awayPlayerId
        );
        
        if (fixture) {
            await updateFixture({
                ...fixture,
                played: true
            });
        }
        
        // Refresh displays
        await refreshAllDisplays();
        
        console.log('✅ Result added online:', newResult.id);
        showNotification('Result added successfully!', 'success');
        return newResult;
    } catch (error) {
        console.error('❌ Error adding result:', error);
        showNotification('Error adding result: ' + error.message, 'error');
        throw error;
    }
}

async function updateResult(updatedResult) {
    try {
        console.log('✏️ Updating result online:', updatedResult.id);
        
        if (!updatedResult.id) {
            throw new Error('Result ID is required for update');
        }

        updatedResult.updatedAt = new Date().toISOString();
        
        // Update directly via API
        const result = await eflAPI.updateResult(updatedResult.id, updatedResult);
        
        // Refresh displays
        await refreshAllDisplays();
        
        console.log('✅ Result updated online:', updatedResult.id);
        showNotification('Result updated successfully!', 'success');
        return result;
    } catch (error) {
        console.error('❌ Error updating result:', error);
        showNotification('Error updating result: ' + error.message, 'error');
        throw error;
    }
}

async function deleteResult(resultId) {
    try {
        console.log('🗑️ Deleting result online:', resultId);
        
        if (!resultId) {
            throw new Error('Result ID is required for deletion');
        }

        // Get result first to update related fixture
        const result = await getResultById(resultId);
        
        // Delete directly via API
        await eflAPI.deleteResult(resultId);
        
        // Mark fixture as unplayed if result exists
        if (result) {
            const fixtures = await getData(DB_KEYS.FIXTURES);
            const fixture = fixtures.find(f => 
                f.homePlayerId === result.homePlayerId && 
                f.awayPlayerId === result.awayPlayerId
            );
            
            if (fixture) {
                await updateFixture({
                    ...fixture,
                    played: false
                });
            }
        }
        
        // Refresh displays
        await refreshAllDisplays();
        
        console.log('✅ Result deleted online:', resultId);
        showNotification('Result deleted successfully!', 'success');
        return true;
    } catch (error) {
        console.error('❌ Error deleting result:', error);
        showNotification('Error deleting result: ' + error.message, 'error');
        throw error;
    }
}

// Statistics and calculations - Now async
async function calculatePlayerStats(playerId) {
    try {
        const results = await getData(DB_KEYS.RESULTS);
        const playerResults = results.filter(r => 
            r && (r.homePlayerId === playerId || r.awayPlayerId === playerId)
        );

        let stats = {
            played: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            goalDifference: 0,
            points: 0
        };

        playerResults.forEach(result => {
            if (!result) return;
            
            const isHome = result.homePlayerId === playerId;
            const playerScore = isHome ? result.homeScore : result.awayScore;
            const opponentScore = isHome ? result.awayScore : result.homeScore;

            stats.played++;
            stats.goalsFor += playerScore || 0;
            stats.goalsAgainst += opponentScore || 0;

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
        return {
            played: 0, wins: 0, draws: 0, losses: 0,
            goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0
        };
    }
}

// Get recent form for a player - Now async
async function getRecentForm(playerId, matches = 5) {
    try {
        const results = await getData(DB_KEYS.RESULTS);
        const playerResults = results.filter(r => 
            r && (r.homePlayerId === playerId || r.awayPlayerId === playerId)
        ).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, matches);

        return playerResults.map(result => {
            if (!result) return '-';
            
            const isHome = result.homePlayerId === playerId;
            const playerScore = isHome ? result.homeScore : result.awayScore;
            const opponentScore = isHome ? result.awayScore : result.homeScore;

            if (playerScore > opponentScore) return 'W';
            if (playerScore === opponentScore) return 'D';
            return 'L';
        }).reverse();
    } catch (error) {
        console.error('Error getting recent form:', error);
        return [];
    }
}

// League table function - Now async
async function getLeagueTable() {
    try {
        const players = await getData(DB_KEYS.PLAYERS);
        
        const tablePromises = players.map(async (player) => {
            if (!player) return null;
            
            const stats = await calculatePlayerStats(player.id);
            const form = await getRecentForm(player.id, 5);
            
            return {
                id: player.id,
                name: player.name,
                team: player.team,
                played: stats.played,
                wins: stats.wins,
                draws: stats.draws,
                losses: stats.losses,
                goalsFor: stats.goalsFor,
                goalsAgainst: stats.goalsAgainst,
                goalDifference: stats.goalDifference,
                points: stats.points,
                form: form
            };
        });

        const tableData = (await Promise.all(tablePromises)).filter(player => player !== null);

        return tableData.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
            return b.goalsFor - a.goalsFor;
        });
    } catch (error) {
        console.error('Error getting league table:', error);
        return [];
    }
}

// Utility functions
function formatDisplayDate(dateString) {
    if (!dateString) return 'TBD';
    
    try {
        const options = { 
            weekday: 'short', 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        };
        return new Date(dateString).toLocaleDateString('en-US', options);
    } catch (error) {
        console.error('Error formatting date:', error);
        return dateString;
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = `
        top: 20px;
        right: 20px;
        z-index: 1060;
        min-width: 300px;
        max-width: 400px;
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
    }, 5000);
}

function updateSyncStatus() {
    const syncStatus = document.getElementById('sync-status');
    if (!syncStatus) return;

    // Always online now
    syncStatus.className = 'badge bg-success';
    syncStatus.innerHTML = '<i class="fas fa-cloud me-1"></i>Online';
    syncStatus.title = 'Fully online mode - no local storage';
}

// Data export/import functions - Updated for online
async function exportData() {
    try {
        const [players, fixtures, results] = await Promise.all([
            getData(DB_KEYS.PLAYERS),
            getData(DB_KEYS.FIXTURES),
            getData(DB_KEYS.RESULTS)
        ]);

        const data = {
            players,
            fixtures,
            results,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };

        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `efootball_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('Data exported successfully!', 'success');
    } catch (error) {
        console.error('Error exporting data:', error);
        showNotification('Error exporting data: ' + error.message, 'error');
    }
}

// Initialize database when script loads
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Initializing online database system...');
    
    // Wait for API to be available
    if (typeof eflAPI === 'undefined') {
        console.error('EFL API not found. Make sure api.js is loaded first.');
        showNotification('Error: API system not available', 'error');
        return;
    }
    
    try {
        await initializeDatabase();
        console.log('✅ Online database system initialized');
        
        // Update sync status to show online
        updateSyncStatus();
    } catch (error) {
        console.error('❌ Failed to initialize online database:', error);
        showNotification('Failed to connect to server. Please refresh the page.', 'error');
    }
});

// Make functions globally available
window.getData = getData;
window.getPlayerById = getPlayerById;
window.getFixtureById = getFixtureById;
window.getResultById = getResultById;
window.addPlayer = addPlayer;
window.updatePlayer = updatePlayer;
window.deletePlayer = deletePlayer;
window.addFixture = addFixture;
window.updateFixture = updateFixture;
window.deleteFixture = deleteFixture;
window.addResult = addResult;
window.updateResult = updateResult;
window.deleteResult = deleteResult;
window.calculatePlayerStats = calculatePlayerStats;
window.getLeagueTable = getLeagueTable;
window.getRecentForm = getRecentForm;
window.formatDisplayDate = formatDisplayDate;
window.showNotification = showNotification;
window.updateSyncStatus = updateSyncStatus;
window.initializeDatabase = initializeDatabase;
window.refreshAllDisplays = refreshAllDisplays;
window.DB_KEYS = DB_KEYS;
window.BALANCED_TEAMS = BALANCED_TEAMS;

// Remove localStorage-dependent functions
window.removeDuplicatePlayers = () => console.log('Local storage functions disabled in online mode');
window.emergencyCleanup = () => console.log('Local storage functions disabled in online mode');
window.saveData = () => console.log('Local storage functions disabled in online mode');
