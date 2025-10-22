// Database and Data Management System
const DB_KEYS = {
    PLAYERS: 'efl_players',
    FIXTURES: 'efl_fixtures',
    RESULTS: 'efl_results',
    ADMIN_AUTH: 'efl_admin_auth',
    TOURNAMENT_UPDATES: 'efl_tournament_updates'
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

// Sample players data - FIXED: No duplicates, unique IDs
const DEFAULT_PLAYERS = [
    { 
        id: 1, 
        name: 'alwaysresistance', 
        team: 'Kenya', 
        photo: 'https://i.ibb.co/0jmt3HXf/alwaysresistance.jpg', 
        strength: 3138, 
        teamColor: '#000000', 
        defaultPhoto: 'https://i.ibb.co/0jmt3HXf/alwaysresistance.jpg'
    },
    { 
        id: 2, 
        name: 'lildrip035', 
        team: 'Chelsea', 
        photo: 'https://i.ibb.co/CcXdyfc/lildrip035.jpg',
        strength: 3100, 
        teamColor: '#034694', 
        defaultPhoto: 'https://i.ibb.co/CcXdyfc/lildrip035.jpg'
    },
    { 
        id: 3, 
        name: 'Sergent white', 
        team: 'Chelsea', 
        photo: 'https://i.ibb.co/TD6HHksv/sergent-white.jpg', 
        strength: 3042, 
        teamColor: '#034694', 
        defaultPhoto: 'https://i.ibb.co/TD6HHksv/sergent-white.jpg'
    },
    { 
        id: 4, 
        name: 'skangaKe254', 
        team: 'Liverpool', 
        photo: 'https://i.ibb.co/Wv5nbZRy/skanga-Ke254.jpg', 
        strength: 2700, 
        teamColor: '#c8102e', 
        defaultPhoto: 'https://i.ibb.co/Wv5nbZRy/skanga-Ke254.jpg'
    },
    { 
        id: 5, 
        name: 'Drexas', 
        team: 'Everton', 
        photo: 'https://i.ibb.co/2mzRJVn/drexas.jpg', 
        strength: 2792, 
        teamColor: '#003399', 
        defaultPhoto: 'https://i.ibb.co/2mzRJVn/drexas.jpg'
    },
    { 
        id: 6, 
        name: 'Collo leevan', 
        team: 'Manchester United', 
        photo: 'https://i.ibb.co/nqyFvzvf/collo-leevan.jpg', 
        strength: 2448, 
        teamColor: '#da291c', 
        defaultPhoto: 'https://i.ibb.co/nqyFvzvf/collo-leevan.jpg'
    },
    { 
        id: 7, 
        name: 'captainkenn', 
        team: 'West Ham', 
        photo: 'https://i.ibb.co/35kMmxjW/captainkenn.jpg', 
        strength: 3110, 
        teamColor: '#7c2c3b', 
        defaultPhoto: 'https://i.ibb.co/35kMmxjW/captainkenn.jpg'
    },
    { 
        id: 8,
        name: 'Bora kesho',
        team: 'Man U',
        photo: 'https://i.ibb.co/7NXyjhWR/Bora-20kesho.jpg',
        strength: 3177,
        teamColor: '#DA291C', // Manchester United red
        defaultPhoto: 'https://i.ibb.co/7NXyjhWR/Bora-20kesho.jpg'
    }
];

// ✅ Function to remove duplicate players
function removeDuplicatePlayers() {
    const players = getData(DB_KEYS.PLAYERS);

    if (!players || players.length === 0) return [];

    const uniquePlayers = [];
    const seenPlayers = new Map();

    players.forEach(player => {
        if (!player || !player.id) return; // Skip invalid players

        // Use ID as the primary key for uniqueness
        if (!seenPlayers.has(player.id)) {
            seenPlayers.set(player.id, true);
            uniquePlayers.push(player);
        } else {
            console.warn(`🧹 Removing duplicate player with ID ${player.id}: ${player.name}`);
        }
    });

    // Save cleaned players array
    saveData(DB_KEYS.PLAYERS, uniquePlayers);
    console.log(`✅ Cleaned players: ${players.length} → ${uniquePlayers.length}`);

    return uniquePlayers;
}

// ✅ Initialize database with version control + duplicates cleanup
function initializeDatabase() {
    console.log('⚙️ Initializing database...');

    const existingPlayers = getData(DB_KEYS.PLAYERS);
    const DB_VERSION_KEY = 'efl_db_version';
    const CURRENT_VERSION = '1.1.0';

    const savedVersion = localStorage.getItem(DB_VERSION_KEY);

    // 🧩 Case 1: No players or version change → reset database
    if (!existingPlayers || existingPlayers.length === 0 || savedVersion !== CURRENT_VERSION) {
        console.log('⚙️ Setting up new player data...');

        // Set default values for sample players
        const samplePlayers = DEFAULT_PLAYERS.map(player => ({
            ...player,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }));

        // Save sample players
        saveData(DB_KEYS.PLAYERS, samplePlayers);

        // Generate sample fixtures
        generateSampleFixtures();

        // Initialize empty results
        saveData(DB_KEYS.RESULTS, []);

        // Save current version
        localStorage.setItem(DB_VERSION_KEY, CURRENT_VERSION);

        console.log(`✅ Database initialized with ${samplePlayers.length} players (version ${CURRENT_VERSION})`);
        return;
    }

    // 🧩 Case 2: Existing data → clean duplicates
    console.log(`✅ Database already initialized with ${existingPlayers.length} players`);
    removeDuplicatePlayers();
}

// Generate sample fixtures - FIXED: Better fixture generation
function generateSampleFixtures() {
    const players = getData(DB_KEYS.PLAYERS);
    const fixtures = [];
    let fixtureId = 1;
    const startDate = new Date();
    
    // Create a simple round-robin with only one match between each pair
    const matchPairs = [];
    
    for (let i = 0; i < players.length; i++) {
        for (let j = i + 1; j < players.length; j++) {
            matchPairs.push([players[i], players[j]]);
        }
    }
    
    // Create fixtures (one match between each pair)
    matchPairs.forEach(([player1, player2], index) => {
        const matchDate = new Date(startDate);
        matchDate.setDate(matchDate.getDate() + index * 2); // Matches every 2 days
        
        fixtures.push({
            id: fixtureId++,
            homePlayerId: player1.id,
            awayPlayerId: player2.id,
            date: matchDate.toISOString().split('T')[0],
            time: '15:00',
            venue: 'Virtual Stadium ' + String.fromCharCode(65 + (index % 3)),
            played: false,
            isHomeLeg: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
    });
    
    saveData(DB_KEYS.FIXTURES, fixtures);
    console.log('Generated', fixtures.length, 'fixtures');
}

// Data management functions
function getData(key) {
    try {
        const data = localStorage.getItem(key);
        if (!data) return [];
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error('Error getting data for key:', key, error);
        return [];
    }
}

function saveData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Error saving data for key:', key, error);
        return false;
    }
}

function getPlayerById(playerId) {
    const players = getData(DB_KEYS.PLAYERS);
    return players.find(p => p && p.id === playerId);
}

function getFixtureById(fixtureId) {
    const fixtures = getData(DB_KEYS.FIXTURES);
    return fixtures.find(f => f && f.id === fixtureId);
}

function getResultById(resultId) {
    const results = getData(DB_KEYS.RESULTS);
    return results.find(r => r && r.id === resultId);
}

// ✅ ADD THIS FUNCTION to refresh all displays
function refreshAllDisplays() {
    console.log('🔄 Refreshing all displays...');
    
    // Refresh main app displays
    if (typeof renderLeagueTable === 'function') {
        renderLeagueTable();
    }
    if (typeof renderPlayers === 'function') {
        renderPlayers();
    }
    if (typeof renderHomePage === 'function') {
        renderHomePage();
    }
    if (typeof renderFixtures === 'function') {
        renderFixtures();
    }
    if (typeof renderResults === 'function') {
        renderResults();
    }
    
    // Refresh admin displays if on admin page
    if (typeof renderAdminPlayers === 'function') {
        renderAdminPlayers();
    }
    if (typeof renderAdminFixtures === 'function') {
        renderAdminFixtures();
    }
    if (typeof renderAdminResults === 'function') {
        renderAdminResults();
    }
    if (typeof populatePlayerSelects === 'function') {
        populatePlayerSelects();
    }
    
    // Refresh advanced stats if available
    if (typeof advancedStats !== 'undefined' && typeof advancedStats.loadAdvancedStatsDashboard === 'function') {
        advancedStats.loadAdvancedStatsDashboard();
    }
    
    console.log('✅ All displays refreshed');
}

// Player management functions - FIXED: Better duplicate prevention
async function addPlayer(playerData) {
    try {
        const players = getData(DB_KEYS.PLAYERS);
        
        // Check for duplicates by name and team
        const isDuplicate = players.some(player => 
            player.name.toLowerCase() === playerData.name.toLowerCase() &&
            player.team.toLowerCase() === playerData.team.toLowerCase()
        );
        
        if (isDuplicate) {
            throw new Error(`Player "${playerData.name}" already exists in team ${playerData.team}`);
        }
        
        // Generate new ID
        const maxId = players.length > 0 ? Math.max(...players.map(p => p.id || 0)) : 0;
        const newId = maxId + 1;
        
        const newPlayer = {
            ...playerData,
            id: newId,
            photo: playerData.photo || `https://via.placeholder.com/100/1a1a2e/ffffff?text=${playerData.name.charAt(0)}`,
            defaultPhoto: playerData.photo || `https://via.placeholder.com/100/1a1a2e/ffffff?text=${playerData.name.charAt(0)}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        players.push(newPlayer);
        saveData(DB_KEYS.PLAYERS, players);
        
        // ✅ CRITICAL: Refresh ALL frontend displays
        refreshAllDisplays();
        
        // Sync with server if online
        if (typeof eflAPI !== 'undefined' && eflAPI.isOnline) {
            await eflAPI.addPlayer(newPlayer);
        }
        
        console.log('Player added:', newPlayer.name, '(ID:', newPlayer.id + ')');
        showNotification('Player added successfully!', 'success');
        return newPlayer;
    } catch (error) {
        console.error('Error adding player:', error);
        showNotification('Error adding player: ' + error.message, 'error');
        throw error;
    }
}

async function updatePlayer(updatedPlayer) {
    try {
        const players = getData(DB_KEYS.PLAYERS);
        const index = players.findIndex(p => p.id === updatedPlayer.id);
        
        if (index !== -1) {
            updatedPlayer.updatedAt = new Date().toISOString();
            players[index] = { ...players[index], ...updatedPlayer };
            saveData(DB_KEYS.PLAYERS, players);
            
            // ✅ Refresh displays after update
            refreshAllDisplays();
            
            // Sync with server if online
            if (typeof eflAPI !== 'undefined' && eflAPI.isOnline) {
                await eflAPI.updatePlayer(updatedPlayer.id, updatedPlayer);
            }
            
            console.log('Player updated:', updatedPlayer.name);
            showNotification('Player updated successfully!', 'success');
            return updatedPlayer;
        }
        throw new Error('Player not found');
    } catch (error) {
        console.error('Error updating player:', error);
        showNotification('Error updating player: ' + error.message, 'error');
        throw error;
    }
}

async function deletePlayer(playerId) {
    try {
        let players = getData(DB_KEYS.PLAYERS);
        players = players.filter(p => p.id !== playerId);
        saveData(DB_KEYS.PLAYERS, players);
        
        // Also remove related fixtures and results
        let fixtures = getData(DB_KEYS.FIXTURES);
        fixtures = fixtures.filter(f => f.homePlayerId !== playerId && f.awayPlayerId !== playerId);
        saveData(DB_KEYS.FIXTURES, fixtures);
        
        let results = getData(DB_KEYS.RESULTS);
        results = results.filter(r => r.homePlayerId !== playerId && r.awayPlayerId !== playerId);
        saveData(DB_KEYS.RESULTS, results);
        
        // ✅ Refresh displays after delete
        refreshAllDisplays();
        
        // Sync with server if online
        if (typeof eflAPI !== 'undefined' && eflAPI.isOnline) {
            await eflAPI.deletePlayer(playerId);
        }
        
        console.log('Player deleted:', playerId);
        showNotification('Player deleted successfully!', 'success');
        return true;
    } catch (error) {
        console.error('Error deleting player:', error);
        showNotification('Error deleting player: ' + error.message, 'error');
        throw error;
    }
}

// Fixture management functions
async function addFixture(fixtureData) {
    try {
        const fixtures = getData(DB_KEYS.FIXTURES);
        
        // Generate new ID
        const maxId = fixtures.length > 0 ? Math.max(...fixtures.map(f => f.id || 0)) : 0;
        const newId = maxId + 1;
        
        const newFixture = {
            ...fixtureData,
            id: newId,
            played: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        fixtures.push(newFixture);
        saveData(DB_KEYS.FIXTURES, fixtures);
        
        // ✅ Refresh displays
        refreshAllDisplays();
        
        // Sync with server if online
        if (typeof eflAPI !== 'undefined' && eflAPI.isOnline) {
            await eflAPI.addFixture(newFixture);
        }
        
        console.log('Fixture added:', newFixture.id);
        showNotification('Fixture added successfully!', 'success');
        return newFixture;
    } catch (error) {
        console.error('Error adding fixture:', error);
        showNotification('Error adding fixture: ' + error.message, 'error');
        throw error;
    }
}

async function updateFixture(updatedFixture) {
    try {
        const fixtures = getData(DB_KEYS.FIXTURES);
        const index = fixtures.findIndex(f => f.id === updatedFixture.id);
        
        if (index !== -1) {
            updatedFixture.updatedAt = new Date().toISOString();
            fixtures[index] = { ...fixtures[index], ...updatedFixture };
            saveData(DB_KEYS.FIXTURES, fixtures);
            
            // ✅ Refresh displays
            refreshAllDisplays();
            
            // Sync with server if online
            if (typeof eflAPI !== 'undefined' && eflAPI.isOnline) {
                await eflAPI.updateFixture(updatedFixture.id, updatedFixture);
            }
            
            console.log('Fixture updated:', updatedFixture.id);
            showNotification('Fixture updated successfully!', 'success');
            return updatedFixture;
        }
        throw new Error('Fixture not found');
    } catch (error) {
        console.error('Error updating fixture:', error);
        showNotification('Error updating fixture: ' + error.message, 'error');
        throw error;
    }
}

async function deleteFixture(fixtureId) {
    try {
        let fixtures = getData(DB_KEYS.FIXTURES);
        fixtures = fixtures.filter(f => f.id !== fixtureId);
        saveData(DB_KEYS.FIXTURES, fixtures);
        
        // Also remove related results
        let results = getData(DB_KEYS.RESULTS);
        const fixture = getFixtureById(fixtureId);
        if (fixture) {
            results = results.filter(r => 
                !(r.homePlayerId === fixture.homePlayerId && r.awayPlayerId === fixture.awayPlayerId)
            );
            saveData(DB_KEYS.RESULTS, results);
        }
        
        // ✅ Refresh displays
        refreshAllDisplays();
        
        // Sync with server if online
        if (typeof eflAPI !== 'undefined' && eflAPI.isOnline) {
            await eflAPI.deleteFixture(fixtureId);
        }
        
        console.log('Fixture deleted:', fixtureId);
        showNotification('Fixture deleted successfully!', 'success');
        return true;
    } catch (error) {
        console.error('Error deleting fixture:', error);
        showNotification('Error deleting fixture: ' + error.message, 'error');
        throw error;
    }
}

// Result management functions
async function addResult(resultData) {
    try {
        const results = getData(DB_KEYS.RESULTS);
        
        // Generate new ID
        const maxId = results.length > 0 ? Math.max(...results.map(r => r.id || 0)) : 0;
        const newId = maxId + 1;
        
        const newResult = {
            ...resultData,
            id: newId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        results.push(newResult);
        saveData(DB_KEYS.RESULTS, results);
        
        // Mark fixture as played
        const fixtures = getData(DB_KEYS.FIXTURES);
        const fixtureIndex = fixtures.findIndex(f => 
            f.homePlayerId === resultData.homePlayerId && 
            f.awayPlayerId === resultData.awayPlayerId
        );
        
        if (fixtureIndex !== -1) {
            fixtures[fixtureIndex].played = true;
            fixtures[fixtureIndex].updatedAt = new Date().toISOString();
            saveData(DB_KEYS.FIXTURES, fixtures);
        }
        
        // ✅ Refresh displays
        refreshAllDisplays();
        
        // Sync with server if online
        if (typeof eflAPI !== 'undefined' && eflAPI.isOnline) {
            await eflAPI.addResult(newResult);
        }
        
        console.log('Result added:', newResult.id);
        showNotification('Result added successfully!', 'success');
        return newResult;
    } catch (error) {
        console.error('Error adding result:', error);
        showNotification('Error adding result: ' + error.message, 'error');
        throw error;
    }
}

async function updateResult(updatedResult) {
    try {
        const results = getData(DB_KEYS.RESULTS);
        const index = results.findIndex(r => r.id === updatedResult.id);
        
        if (index !== -1) {
            updatedResult.updatedAt = new Date().toISOString();
            results[index] = { ...results[index], ...updatedResult };
            saveData(DB_KEYS.RESULTS, results);
            
            // ✅ Refresh displays
            refreshAllDisplays();
            
            // Sync with server if online
            if (typeof eflAPI !== 'undefined' && eflAPI.isOnline) {
                await eflAPI.updateResult(updatedResult.id, updatedResult);
            }
            
            console.log('Result updated:', updatedResult.id);
            showNotification('Result updated successfully!', 'success');
            return updatedResult;
        }
        throw new Error('Result not found');
    } catch (error) {
        console.error('Error updating result:', error);
        showNotification('Error updating result: ' + error.message, 'error');
        throw error;
    }
}

async function deleteResult(resultId) {
    try {
        let results = getData(DB_KEYS.RESULTS);
        const result = getResultById(resultId);
        
        results = results.filter(r => r.id !== resultId);
        saveData(DB_KEYS.RESULTS, results);
        
        // Mark fixture as unplayed
        if (result) {
            const fixtures = getData(DB_KEYS.FIXTURES);
            const fixtureIndex = fixtures.findIndex(f => 
                f.homePlayerId === result.homePlayerId && 
                f.awayPlayerId === result.awayPlayerId
            );
            
            if (fixtureIndex !== -1) {
                fixtures[fixtureIndex].played = false;
                fixtures[fixtureIndex].updatedAt = new Date().toISOString();
                saveData(DB_KEYS.FIXTURES, fixtures);
            }
        }
        
        // ✅ Refresh displays
        refreshAllDisplays();
        
        // Sync with server if online
        if (typeof eflAPI !== 'undefined' && eflAPI.isOnline) {
            await eflAPI.deleteResult(resultId);
        }
        
        console.log('Result deleted:', resultId);
        showNotification('Result deleted successfully!', 'success');
        return true;
    } catch (error) {
        console.error('Error deleting result:', error);
        showNotification('Error deleting result: ' + error.message, 'error');
        throw error;
    }
}

// Statistics and calculations - FIXED: Better player stats calculation
function calculatePlayerStats(playerId) {
    const results = getData(DB_KEYS.RESULTS);
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
}

// NEW: Get recent form for a player
function getRecentForm(playerId, matches = 5) {
    const results = getData(DB_KEYS.RESULTS);
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
    }).reverse(); // Show oldest first
}

// FIXED: League table function with duplicate prevention
function getLeagueTable() {
    // First, clean any duplicate players
    const uniquePlayers = removeDuplicatePlayers();
    
    const tableData = uniquePlayers.map(player => {
        if (!player) return null;
        
        const stats = calculatePlayerStats(player.id);
        const form = getRecentForm(player.id, 5);
        
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
    }).filter(player => player !== null); // Remove any null entries

    // Sort by points, then goal difference, then goals for
    return tableData.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        return b.goalsFor - a.goalsFor;
    });
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
    // Create notification element
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
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
}

function updateSyncStatus() {
    const syncStatus = document.getElementById('sync-status');
    if (!syncStatus) return;

    if (typeof eflAPI !== 'undefined' && eflAPI.isOnline) {
        syncStatus.className = 'badge bg-success';
        syncStatus.innerHTML = '<i class="fas fa-cloud me-1"></i>Online';
    } else {
        syncStatus.className = 'badge bg-warning';
        syncStatus.innerHTML = '<i class="fas fa-cloud me-1"></i>Offline';
    }
}

// Data export/import functions
function exportData() {
    const data = {
        players: getData(DB_KEYS.PLAYERS),
        fixtures: getData(DB_KEYS.FIXTURES),
        results: getData(DB_KEYS.RESULTS),
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
}

function importData(jsonData) {
    try {
        const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
        
        if (data.players) saveData(DB_KEYS.PLAYERS, data.players);
        if (data.fixtures) saveData(DB_KEYS.FIXTURES, data.fixtures);
        if (data.results) saveData(DB_KEYS.RESULTS, data.results);
        
        // Clean duplicates after import
        removeDuplicatePlayers();
        
        // Refresh all displays
        refreshAllDisplays();
        
        showNotification('Data imported successfully!', 'success');
        return true;
    } catch (error) {
        console.error('Error importing data:', error);
        showNotification('Error importing data!', 'error');
        return false;
    }
}

// NEW: Emergency cleanup function
function emergencyCleanup() {
    if (confirm('This will remove all duplicate players and fix the league table. Continue?')) {
        const initialPlayers = getData(DB_KEYS.PLAYERS);
        const cleanedPlayers = removeDuplicatePlayers();
        
        // Refresh all displays
        refreshAllDisplays();
        
        showNotification(`Removed ${initialPlayers.length - cleanedPlayers.length} duplicate players!`, 'success');
    }
}

// Initialize database when script loads
document.addEventListener('DOMContentLoaded', function() {
    initializeDatabase();
    console.log('Database system initialized');
    
    // Run cleanup on startup to fix any existing duplicates
    setTimeout(() => {
        removeDuplicatePlayers();
    }, 1000);
});

// Make functions globally available
window.getData = getData;
window.saveData = saveData;
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
window.removeDuplicatePlayers = removeDuplicatePlayers;
window.emergencyCleanup = emergencyCleanup;
window.refreshAllDisplays = refreshAllDisplays;
window.DB_KEYS = DB_KEYS;
window.BALANCED_TEAMS = BALANCED_TEAMS;
window.DEFAULT_PLAYERS = DEFAULT_PLAYERS;// Database and Data Management System
const DB_KEYS = {
    PLAYERS: 'efl_players',
    FIXTURES: 'efl_fixtures',
    RESULTS: 'efl_results',
    ADMIN_AUTH: 'efl_admin_auth',
    TOURNAMENT_UPDATES: 'efl_tournament_updates'
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

// Sample players data - FIXED: No duplicates, unique IDs
const DEFAULT_PLAYERS = [
    { 
        id: 1, 
        name: 'alwaysresistance', 
        team: 'Kenya', 
        photo: 'https://i.ibb.co/0jmt3HXf/alwaysresistance.jpg', 
        strength: 3138, 
        teamColor: '#000000', 
        defaultPhoto: 'https://i.ibb.co/0jmt3HXf/alwaysresistance.jpg'
    },
    { 
        id: 2, 
        name: 'lildrip035', 
        team: 'Chelsea', 
        photo: 'https://i.ibb.co/CcXdyfc/lildrip035.jpg',
        strength: 3100, 
        teamColor: '#034694', 
        defaultPhoto: 'https://i.ibb.co/CcXdyfc/lildrip035.jpg'
    },
    { 
        id: 3, 
        name: 'Sergent white', 
        team: 'Chelsea', 
        photo: 'https://i.ibb.co/TD6HHksv/sergent-white.jpg', 
        strength: 3042, 
        teamColor: '#034694', 
        defaultPhoto: 'https://i.ibb.co/TD6HHksv/sergent-white.jpg'
    },
    { 
        id: 4, 
        name: 'skangaKe254', 
        team: 'Liverpool', 
        photo: 'https://i.ibb.co/Wv5nbZRy/skanga-Ke254.jpg', 
        strength: 2700, 
        teamColor: '#c8102e', 
        defaultPhoto: 'https://i.ibb.co/Wv5nbZRy/skanga-Ke254.jpg'
    },
    { 
        id: 5, 
        name: 'Drexas', 
        team: 'Everton', 
        photo: 'https://i.ibb.co/2mzRJVn/drexas.jpg', 
        strength: 2792, 
        teamColor: '#003399', 
        defaultPhoto: 'https://i.ibb.co/2mzRJVn/drexas.jpg'
    },
    { 
        id: 6, 
        name: 'Collo leevan', 
        team: 'Manchester United', 
        photo: 'https://i.ibb.co/nqyFvzvf/collo-leevan.jpg', 
        strength: 2448, 
        teamColor: '#da291c', 
        defaultPhoto: 'https://i.ibb.co/nqyFvzvf/collo-leevan.jpg'
    },
    { 
        id: 7, 
        name: 'captainkenn', 
        team: 'West Ham', 
        photo: 'https://i.ibb.co/35kMmxjW/captainkenn.jpg', 
        strength: 3110, 
        teamColor: '#7c2c3b', 
        defaultPhoto: 'https://i.ibb.co/35kMmxjW/captainkenn.jpg'
    },
    { 
        id: 8,
        name: 'Bora kesho',
        team: 'Man U',
        photo: 'https://i.ibb.co/7NXyjhWR/Bora-20kesho.jpg',
        strength: 3177,
        teamColor: '#DA291C', // Manchester United red
        defaultPhoto: 'https://i.ibb.co/7NXyjhWR/Bora-20kesho.jpg'
    }
];

// ✅ Function to remove duplicate players
function removeDuplicatePlayers() {
    const players = getData(DB_KEYS.PLAYERS);

    if (!players || players.length === 0) return [];

    const uniquePlayers = [];
    const seenPlayers = new Map();

    players.forEach(player => {
        if (!player || !player.id) return; // Skip invalid players

        // Use ID as the primary key for uniqueness
        if (!seenPlayers.has(player.id)) {
            seenPlayers.set(player.id, true);
            uniquePlayers.push(player);
        } else {
            console.warn(`🧹 Removing duplicate player with ID ${player.id}: ${player.name}`);
        }
    });

    // Save cleaned players array
    saveData(DB_KEYS.PLAYERS, uniquePlayers);
    console.log(`✅ Cleaned players: ${players.length} → ${uniquePlayers.length}`);

    return uniquePlayers;
}

// ✅ Initialize database with version control + duplicates cleanup
function initializeDatabase() {
    console.log('⚙️ Initializing database...');

    const existingPlayers = getData(DB_KEYS.PLAYERS);
    const DB_VERSION_KEY = 'efl_db_version';
    const CURRENT_VERSION = '1.1.0';

    const savedVersion = localStorage.getItem(DB_VERSION_KEY);

    // 🧩 Case 1: No players or version change → reset database
    if (!existingPlayers || existingPlayers.length === 0 || savedVersion !== CURRENT_VERSION) {
        console.log('⚙️ Setting up new player data...');

        // Set default values for sample players
        const samplePlayers = DEFAULT_PLAYERS.map(player => ({
            ...player,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }));

        // Save sample players
        saveData(DB_KEYS.PLAYERS, samplePlayers);

        // Generate sample fixtures
        generateSampleFixtures();

        // Initialize empty results
        saveData(DB_KEYS.RESULTS, []);

        // Save current version
        localStorage.setItem(DB_VERSION_KEY, CURRENT_VERSION);

        console.log(`✅ Database initialized with ${samplePlayers.length} players (version ${CURRENT_VERSION})`);
        return;
    }

    // 🧩 Case 2: Existing data → clean duplicates
    console.log(`✅ Database already initialized with ${existingPlayers.length} players`);
    removeDuplicatePlayers();
}

// Generate sample fixtures - FIXED: Better fixture generation
function generateSampleFixtures() {
    const players = getData(DB_KEYS.PLAYERS);
    const fixtures = [];
    let fixtureId = 1;
    const startDate = new Date();
    
    // Create a simple round-robin with only one match between each pair
    const matchPairs = [];
    
    for (let i = 0; i < players.length; i++) {
        for (let j = i + 1; j < players.length; j++) {
            matchPairs.push([players[i], players[j]]);
        }
    }
    
    // Create fixtures (one match between each pair)
    matchPairs.forEach(([player1, player2], index) => {
        const matchDate = new Date(startDate);
        matchDate.setDate(matchDate.getDate() + index * 2); // Matches every 2 days
        
        fixtures.push({
            id: fixtureId++,
            homePlayerId: player1.id,
            awayPlayerId: player2.id,
            date: matchDate.toISOString().split('T')[0],
            time: '15:00',
            venue: 'Virtual Stadium ' + String.fromCharCode(65 + (index % 3)),
            played: false,
            isHomeLeg: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
    });
    
    saveData(DB_KEYS.FIXTURES, fixtures);
    console.log('Generated', fixtures.length, 'fixtures');
}

// Data management functions
function getData(key) {
    try {
        const data = localStorage.getItem(key);
        if (!data) return [];
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error('Error getting data for key:', key, error);
        return [];
    }
}

function saveData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Error saving data for key:', key, error);
        return false;
    }
}

function getPlayerById(playerId) {
    const players = getData(DB_KEYS.PLAYERS);
    return players.find(p => p && p.id === playerId);
}

function getFixtureById(fixtureId) {
    const fixtures = getData(DB_KEYS.FIXTURES);
    return fixtures.find(f => f && f.id === fixtureId);
}

function getResultById(resultId) {
    const results = getData(DB_KEYS.RESULTS);
    return results.find(r => r && r.id === resultId);
}

// ✅ ADD THIS FUNCTION to refresh all displays
function refreshAllDisplays() {
    console.log('🔄 Refreshing all displays...');
    
    // Refresh main app displays
    if (typeof renderLeagueTable === 'function') {
        renderLeagueTable();
    }
    if (typeof renderPlayers === 'function') {
        renderPlayers();
    }
    if (typeof renderHomePage === 'function') {
        renderHomePage();
    }
    if (typeof renderFixtures === 'function') {
        renderFixtures();
    }
    if (typeof renderResults === 'function') {
        renderResults();
    }
    
    // Refresh admin displays if on admin page
    if (typeof renderAdminPlayers === 'function') {
        renderAdminPlayers();
    }
    if (typeof renderAdminFixtures === 'function') {
        renderAdminFixtures();
    }
    if (typeof renderAdminResults === 'function') {
        renderAdminResults();
    }
    if (typeof populatePlayerSelects === 'function') {
        populatePlayerSelects();
    }
    
    // Refresh advanced stats if available
    if (typeof advancedStats !== 'undefined' && typeof advancedStats.loadAdvancedStatsDashboard === 'function') {
        advancedStats.loadAdvancedStatsDashboard();
    }
    
    console.log('✅ All displays refreshed');
}

// Player management functions - FIXED: Better duplicate prevention
async function addPlayer(playerData) {
    try {
        const players = getData(DB_KEYS.PLAYERS);
        
        // Check for duplicates by name and team
        const isDuplicate = players.some(player => 
            player.name.toLowerCase() === playerData.name.toLowerCase() &&
            player.team.toLowerCase() === playerData.team.toLowerCase()
        );
        
        if (isDuplicate) {
            throw new Error(`Player "${playerData.name}" already exists in team ${playerData.team}`);
        }
        
        // Generate new ID
        const maxId = players.length > 0 ? Math.max(...players.map(p => p.id || 0)) : 0;
        const newId = maxId + 1;
        
        const newPlayer = {
            ...playerData,
            id: newId,
            photo: playerData.photo || `https://via.placeholder.com/100/1a1a2e/ffffff?text=${playerData.name.charAt(0)}`,
            defaultPhoto: playerData.photo || `https://via.placeholder.com/100/1a1a2e/ffffff?text=${playerData.name.charAt(0)}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        players.push(newPlayer);
        saveData(DB_KEYS.PLAYERS, players);
        
        // ✅ CRITICAL: Refresh ALL frontend displays
        refreshAllDisplays();
        
        // Sync with server if online
        if (typeof eflAPI !== 'undefined' && eflAPI.isOnline) {
            await eflAPI.addPlayer(newPlayer);
        }
        
        console.log('Player added:', newPlayer.name, '(ID:', newPlayer.id + ')');
        showNotification('Player added successfully!', 'success');
        return newPlayer;
    } catch (error) {
        console.error('Error adding player:', error);
        showNotification('Error adding player: ' + error.message, 'error');
        throw error;
    }
}

async function updatePlayer(updatedPlayer) {
    try {
        const players = getData(DB_KEYS.PLAYERS);
        const index = players.findIndex(p => p.id === updatedPlayer.id);
        
        if (index !== -1) {
            updatedPlayer.updatedAt = new Date().toISOString();
            players[index] = { ...players[index], ...updatedPlayer };
            saveData(DB_KEYS.PLAYERS, players);
            
            // ✅ Refresh displays after update
            refreshAllDisplays();
            
            // Sync with server if online
            if (typeof eflAPI !== 'undefined' && eflAPI.isOnline) {
                await eflAPI.updatePlayer(updatedPlayer.id, updatedPlayer);
            }
            
            console.log('Player updated:', updatedPlayer.name);
            showNotification('Player updated successfully!', 'success');
            return updatedPlayer;
        }
        throw new Error('Player not found');
    } catch (error) {
        console.error('Error updating player:', error);
        showNotification('Error updating player: ' + error.message, 'error');
        throw error;
    }
}

async function deletePlayer(playerId) {
    try {
        let players = getData(DB_KEYS.PLAYERS);
        players = players.filter(p => p.id !== playerId);
        saveData(DB_KEYS.PLAYERS, players);
        
        // Also remove related fixtures and results
        let fixtures = getData(DB_KEYS.FIXTURES);
        fixtures = fixtures.filter(f => f.homePlayerId !== playerId && f.awayPlayerId !== playerId);
        saveData(DB_KEYS.FIXTURES, fixtures);
        
        let results = getData(DB_KEYS.RESULTS);
        results = results.filter(r => r.homePlayerId !== playerId && r.awayPlayerId !== playerId);
        saveData(DB_KEYS.RESULTS, results);
        
        // ✅ Refresh displays after delete
        refreshAllDisplays();
        
        // Sync with server if online
        if (typeof eflAPI !== 'undefined' && eflAPI.isOnline) {
            await eflAPI.deletePlayer(playerId);
        }
        
        console.log('Player deleted:', playerId);
        showNotification('Player deleted successfully!', 'success');
        return true;
    } catch (error) {
        console.error('Error deleting player:', error);
        showNotification('Error deleting player: ' + error.message, 'error');
        throw error;
    }
}

// Fixture management functions
async function addFixture(fixtureData) {
    try {
        const fixtures = getData(DB_KEYS.FIXTURES);
        
        // Generate new ID
        const maxId = fixtures.length > 0 ? Math.max(...fixtures.map(f => f.id || 0)) : 0;
        const newId = maxId + 1;
        
        const newFixture = {
            ...fixtureData,
            id: newId,
            played: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        fixtures.push(newFixture);
        saveData(DB_KEYS.FIXTURES, fixtures);
        
        // ✅ Refresh displays
        refreshAllDisplays();
        
        // Sync with server if online
        if (typeof eflAPI !== 'undefined' && eflAPI.isOnline) {
            await eflAPI.addFixture(newFixture);
        }
        
        console.log('Fixture added:', newFixture.id);
        showNotification('Fixture added successfully!', 'success');
        return newFixture;
    } catch (error) {
        console.error('Error adding fixture:', error);
        showNotification('Error adding fixture: ' + error.message, 'error');
        throw error;
    }
}

async function updateFixture(updatedFixture) {
    try {
        const fixtures = getData(DB_KEYS.FIXTURES);
        const index = fixtures.findIndex(f => f.id === updatedFixture.id);
        
        if (index !== -1) {
            updatedFixture.updatedAt = new Date().toISOString();
            fixtures[index] = { ...fixtures[index], ...updatedFixture };
            saveData(DB_KEYS.FIXTURES, fixtures);
            
            // ✅ Refresh displays
            refreshAllDisplays();
            
            // Sync with server if online
            if (typeof eflAPI !== 'undefined' && eflAPI.isOnline) {
                await eflAPI.updateFixture(updatedFixture.id, updatedFixture);
            }
            
            console.log('Fixture updated:', updatedFixture.id);
            showNotification('Fixture updated successfully!', 'success');
            return updatedFixture;
        }
        throw new Error('Fixture not found');
    } catch (error) {
        console.error('Error updating fixture:', error);
        showNotification('Error updating fixture: ' + error.message, 'error');
        throw error;
    }
}

async function deleteFixture(fixtureId) {
    try {
        let fixtures = getData(DB_KEYS.FIXTURES);
        fixtures = fixtures.filter(f => f.id !== fixtureId);
        saveData(DB_KEYS.FIXTURES, fixtures);
        
        // Also remove related results
        let results = getData(DB_KEYS.RESULTS);
        const fixture = getFixtureById(fixtureId);
        if (fixture) {
            results = results.filter(r => 
                !(r.homePlayerId === fixture.homePlayerId && r.awayPlayerId === fixture.awayPlayerId)
            );
            saveData(DB_KEYS.RESULTS, results);
        }
        
        // ✅ Refresh displays
        refreshAllDisplays();
        
        // Sync with server if online
        if (typeof eflAPI !== 'undefined' && eflAPI.isOnline) {
            await eflAPI.deleteFixture(fixtureId);
        }
        
        console.log('Fixture deleted:', fixtureId);
        showNotification('Fixture deleted successfully!', 'success');
        return true;
    } catch (error) {
        console.error('Error deleting fixture:', error);
        showNotification('Error deleting fixture: ' + error.message, 'error');
        throw error;
    }
}

// Result management functions
async function addResult(resultData) {
    try {
        const results = getData(DB_KEYS.RESULTS);
        
        // Generate new ID
        const maxId = results.length > 0 ? Math.max(...results.map(r => r.id || 0)) : 0;
        const newId = maxId + 1;
        
        const newResult = {
            ...resultData,
            id: newId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        results.push(newResult);
        saveData(DB_KEYS.RESULTS, results);
        
        // Mark fixture as played
        const fixtures = getData(DB_KEYS.FIXTURES);
        const fixtureIndex = fixtures.findIndex(f => 
            f.homePlayerId === resultData.homePlayerId && 
            f.awayPlayerId === resultData.awayPlayerId
        );
        
        if (fixtureIndex !== -1) {
            fixtures[fixtureIndex].played = true;
            fixtures[fixtureIndex].updatedAt = new Date().toISOString();
            saveData(DB_KEYS.FIXTURES, fixtures);
        }
        
        // ✅ Refresh displays
        refreshAllDisplays();
        
        // Sync with server if online
        if (typeof eflAPI !== 'undefined' && eflAPI.isOnline) {
            await eflAPI.addResult(newResult);
        }
        
        console.log('Result added:', newResult.id);
        showNotification('Result added successfully!', 'success');
        return newResult;
    } catch (error) {
        console.error('Error adding result:', error);
        showNotification('Error adding result: ' + error.message, 'error');
        throw error;
    }
}

async function updateResult(updatedResult) {
    try {
        const results = getData(DB_KEYS.RESULTS);
        const index = results.findIndex(r => r.id === updatedResult.id);
        
        if (index !== -1) {
            updatedResult.updatedAt = new Date().toISOString();
            results[index] = { ...results[index], ...updatedResult };
            saveData(DB_KEYS.RESULTS, results);
            
            // ✅ Refresh displays
            refreshAllDisplays();
            
            // Sync with server if online
            if (typeof eflAPI !== 'undefined' && eflAPI.isOnline) {
                await eflAPI.updateResult(updatedResult.id, updatedResult);
            }
            
            console.log('Result updated:', updatedResult.id);
            showNotification('Result updated successfully!', 'success');
            return updatedResult;
        }
        throw new Error('Result not found');
    } catch (error) {
        console.error('Error updating result:', error);
        showNotification('Error updating result: ' + error.message, 'error');
        throw error;
    }
}

async function deleteResult(resultId) {
    try {
        let results = getData(DB_KEYS.RESULTS);
        const result = getResultById(resultId);
        
        results = results.filter(r => r.id !== resultId);
        saveData(DB_KEYS.RESULTS, results);
        
        // Mark fixture as unplayed
        if (result) {
            const fixtures = getData(DB_KEYS.FIXTURES);
            const fixtureIndex = fixtures.findIndex(f => 
                f.homePlayerId === result.homePlayerId && 
                f.awayPlayerId === result.awayPlayerId
            );
            
            if (fixtureIndex !== -1) {
                fixtures[fixtureIndex].played = false;
                fixtures[fixtureIndex].updatedAt = new Date().toISOString();
                saveData(DB_KEYS.FIXTURES, fixtures);
            }
        }
        
        // ✅ Refresh displays
        refreshAllDisplays();
        
        // Sync with server if online
        if (typeof eflAPI !== 'undefined' && eflAPI.isOnline) {
            await eflAPI.deleteResult(resultId);
        }
        
        console.log('Result deleted:', resultId);
        showNotification('Result deleted successfully!', 'success');
        return true;
    } catch (error) {
        console.error('Error deleting result:', error);
        showNotification('Error deleting result: ' + error.message, 'error');
        throw error;
    }
}

// Statistics and calculations - FIXED: Better player stats calculation
function calculatePlayerStats(playerId) {
    const results = getData(DB_KEYS.RESULTS);
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
}

// NEW: Get recent form for a player
function getRecentForm(playerId, matches = 5) {
    const results = getData(DB_KEYS.RESULTS);
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
    }).reverse(); // Show oldest first
}

// FIXED: League table function with duplicate prevention
function getLeagueTable() {
    // First, clean any duplicate players
    const uniquePlayers = removeDuplicatePlayers();
    
    const tableData = uniquePlayers.map(player => {
        if (!player) return null;
        
        const stats = calculatePlayerStats(player.id);
        const form = getRecentForm(player.id, 5);
        
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
    }).filter(player => player !== null); // Remove any null entries

    // Sort by points, then goal difference, then goals for
    return tableData.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        return b.goalsFor - a.goalsFor;
    });
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
    // Create notification element
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
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
}

function updateSyncStatus() {
    const syncStatus = document.getElementById('sync-status');
    if (!syncStatus) return;

    if (typeof eflAPI !== 'undefined' && eflAPI.isOnline) {
        syncStatus.className = 'badge bg-success';
        syncStatus.innerHTML = '<i class="fas fa-cloud me-1"></i>Online';
    } else {
        syncStatus.className = 'badge bg-warning';
        syncStatus.innerHTML = '<i class="fas fa-cloud me-1"></i>Offline';
    }
}

// Data export/import functions
function exportData() {
    const data = {
        players: getData(DB_KEYS.PLAYERS),
        fixtures: getData(DB_KEYS.FIXTURES),
        results: getData(DB_KEYS.RESULTS),
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
}

function importData(jsonData) {
    try {
        const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
        
        if (data.players) saveData(DB_KEYS.PLAYERS, data.players);
        if (data.fixtures) saveData(DB_KEYS.FIXTURES, data.fixtures);
        if (data.results) saveData(DB_KEYS.RESULTS, data.results);
        
        // Clean duplicates after import
        removeDuplicatePlayers();
        
        // Refresh all displays
        refreshAllDisplays();
        
        showNotification('Data imported successfully!', 'success');
        return true;
    } catch (error) {
        console.error('Error importing data:', error);
        showNotification('Error importing data!', 'error');
        return false;
    }
}

// NEW: Emergency cleanup function
function emergencyCleanup() {
    if (confirm('This will remove all duplicate players and fix the league table. Continue?')) {
        const initialPlayers = getData(DB_KEYS.PLAYERS);
        const cleanedPlayers = removeDuplicatePlayers();
        
        // Refresh all displays
        refreshAllDisplays();
        
        showNotification(`Removed ${initialPlayers.length - cleanedPlayers.length} duplicate players!`, 'success');
    }
}

// Initialize database when script loads
document.addEventListener('DOMContentLoaded', function() {
    initializeDatabase();
    console.log('Database system initialized');
    
    // Run cleanup on startup to fix any existing duplicates
    setTimeout(() => {
        removeDuplicatePlayers();
    }, 1000);
});

// Make functions globally available
window.getData = getData;
window.saveData = saveData;
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
window.removeDuplicatePlayers = removeDuplicatePlayers;
window.emergencyCleanup = emergencyCleanup;
window.refreshAllDisplays = refreshAllDisplays;
window.DB_KEYS = DB_KEYS;
window.BALANCED_TEAMS = BALANCED_TEAMS;
window.DEFAULT_PLAYERS = DEFAULT_PLAYERS;
