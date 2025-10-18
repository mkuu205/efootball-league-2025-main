// Database and Data Management System
const DB_KEYS = {
    PLAYERS: 'players',
    FIXTURES: 'fixtures',
    RESULTS: 'results',
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

// Initialize database with sample data
function initializeDatabase() {
    console.log('Initializing database...');
    
    // Check if data already exists
    const existingPlayers = getData(DB_KEYS.PLAYERS);
    if (existingPlayers.length > 0) {
        console.log('Database already initialized with', existingPlayers.length, 'players');
        return;
    }

    // Sample players data
    const samplePlayers = [
        { 
            id: 1, 
            name: 'alwaysresistance', 
            team: 'Kenya', 
            photo: 'https://i.ibb.co/0jmt3HXf/alwaysresistance.jpg', 
            strength: 3138, 
            teamColor: '#000000', 
            defaultPhoto: 'https://i.ibb.co/0jmt3HXf/alwaysresistance.jpg', 
            createdAt: new Date() 
        },
        { 
            id: 2, 
            name: 'lildrip035', 
            team: 'Chelsea', 
            photo: 'https://i.ibb.co/CcXdyfc/lildrip035.jpg',
            strength: 3100, 
            teamColor: '#034694', 
            defaultPhoto: 'https://i.ibb.co/CcXdyfc/lildrip035.jpg', 
            createdAt: new Date() 
        },
        { 
            id: 3, 
            name: 'Sergent white', 
            team: 'Chelsea', 
            photo: 'https://i.ibb.co/TD6HHksv/sergent-white.jpg', 
            strength: 3042, 
            teamColor: '#034694', 
            defaultPhoto: 'https://i.ibb.co/TD6HHksv/sergent-white.jpg', 
            createdAt: new Date() 
        },
        { 
            id: 4, 
            name: 'skangaKe254', 
            team: 'Liverpool', 
            photo: 'https://i.ibb.co/Wv5nbZRy/skanga-Ke254.jpg', 
            strength: 2700, 
            teamColor: '#c8102e', 
            defaultPhoto: 'https://i.ibb.co/Wv5nbZRy/skanga-Ke254.jpg', 
            createdAt: new Date() 
        },
        { 
            id: 5, 
            name: 'Drexas', 
            team: 'Everton', 
            photo: 'https://i.ibb.co/2mzRJVn/drexas.jpg', 
            strength: 2792, 
            teamColor: '#003399', 
            defaultPhoto: 'https://i.ibb.co/2mzRJVn/drexas.jpg', 
            createdAt: new Date() 
        },
        { 
            id: 6, 
            name: 'Collo leevan', 
            team: 'Manchester United', 
            photo: 'https://i.ibb.co/nqyFvzvf/collo-leevan.jpg', 
            strength: 2448, 
            teamColor: '#da291c', 
            defaultPhoto: 'https://i.ibb.co/nqyFvzvf/collo-leevan.jpg', 
            createdAt: new Date() 
        },
        { 
            id: 7, 
            name: 'captainkenn', 
            team: 'West Ham', 
            photo: 'https://i.ibb.co/35kMmxjW/captainkenn.jpg', 
            strength: 3110, 
            teamColor: '#7c2c3b', 
            defaultPhoto: 'https://i.ibb.co/35kMmxjW/captainkenn.jpg', 
            createdAt: new Date() 
        }
    ];

    // Save sample players
    saveData(DB_KEYS.PLAYERS, samplePlayers);
    
    // Generate sample fixtures
    generateSampleFixtures();
    
    // Initialize empty results
    saveData(DB_KEYS.RESULTS, []);
    
    console.log('Database initialized successfully with', samplePlayers.length, 'players');
}

// Generate sample fixtures
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
            createdAt: new Date()
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
        return JSON.parse(data);
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

// Player management functions
async function addPlayer(playerData) {
    try {
        const players = getData(DB_KEYS.PLAYERS);
        
        // Generate new ID if not provided
        if (!playerData.id) {
            const maxId = players.length > 0 ? Math.max(...players.map(p => p.id)) : 0;
            playerData.id = maxId + 1;
        }
        
        // Set default values
        playerData.createdAt = new Date();
        playerData.defaultPhoto = playerData.photo || `https://via.placeholder.com/100/1a1a2e/ffffff?text=${playerData.name.charAt(0)}`;
        
        // Add to players array
        players.push(playerData);
        saveData(DB_KEYS.PLAYERS, players);
        
        // Sync with server if online
        if (typeof eflAPI !== 'undefined' && eflAPI.isOnline) {
            await eflAPI.addPlayer(playerData);
        }
        
        console.log('Player added:', playerData);
        return playerData;
    } catch (error) {
        console.error('Error adding player:', error);
        throw error;
    }
}

async function updatePlayer(updatedPlayer) {
    try {
        const players = getData(DB_KEYS.PLAYERS);
        const index = players.findIndex(p => p.id === updatedPlayer.id);
        
        if (index !== -1) {
            updatedPlayer.updatedAt = new Date();
            players[index] = { ...players[index], ...updatedPlayer };
            saveData(DB_KEYS.PLAYERS, players);
            
            // Sync with server if online
            if (typeof eflAPI !== 'undefined' && eflAPI.isOnline) {
                await eflAPI.updatePlayer(updatedPlayer.id, updatedPlayer);
            }
            
            console.log('Player updated:', updatedPlayer);
            return updatedPlayer;
        }
        throw new Error('Player not found');
    } catch (error) {
        console.error('Error updating player:', error);
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
        
        // Sync with server if online
        if (typeof eflAPI !== 'undefined' && eflAPI.isOnline) {
            await eflAPI.deletePlayer(playerId);
        }
        
        console.log('Player deleted:', playerId);
        return true;
    } catch (error) {
        console.error('Error deleting player:', error);
        throw error;
    }
}

// Fixture management functions
async function addFixture(fixtureData) {
    try {
        const fixtures = getData(DB_KEYS.FIXTURES);
        
        // Generate new ID if not provided
        if (!fixtureData.id) {
            const maxId = fixtures.length > 0 ? Math.max(...fixtures.map(f => f.id)) : 0;
            fixtureData.id = maxId + 1;
        }
        
        // Set default values
        fixtureData.createdAt = new Date();
        fixtureData.played = false;
        
        // Add to fixtures array
        fixtures.push(fixtureData);
        saveData(DB_KEYS.FIXTURES, fixtures);
        
        // Sync with server if online
        if (typeof eflAPI !== 'undefined' && eflAPI.isOnline) {
            await eflAPI.addFixture(fixtureData);
        }
        
        console.log('Fixture added:', fixtureData);
        return fixtureData;
    } catch (error) {
        console.error('Error adding fixture:', error);
        throw error;
    }
}

async function updateFixture(updatedFixture) {
    try {
        const fixtures = getData(DB_KEYS.FIXTURES);
        const index = fixtures.findIndex(f => f.id === updatedFixture.id);
        
        if (index !== -1) {
            updatedFixture.updatedAt = new Date();
            fixtures[index] = { ...fixtures[index], ...updatedFixture };
            saveData(DB_KEYS.FIXTURES, fixtures);
            
            // Sync with server if online
            if (typeof eflAPI !== 'undefined' && eflAPI.isOnline) {
                await eflAPI.updateFixture(updatedFixture.id, updatedFixture);
            }
            
            console.log('Fixture updated:', updatedFixture);
            return updatedFixture;
        }
        throw new Error('Fixture not found');
    } catch (error) {
        console.error('Error updating fixture:', error);
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
        
        // Sync with server if online
        if (typeof eflAPI !== 'undefined' && eflAPI.isOnline) {
            await eflAPI.deleteFixture(fixtureId);
        }
        
        console.log('Fixture deleted:', fixtureId);
        return true;
    } catch (error) {
        console.error('Error deleting fixture:', error);
        throw error;
    }
}

// Result management functions
async function addResult(resultData) {
    try {
        const results = getData(DB_KEYS.RESULTS);
        
        // Generate new ID if not provided
        if (!resultData.id) {
            const maxId = results.length > 0 ? Math.max(...results.map(r => r.id)) : 0;
            resultData.id = maxId + 1;
        }
        
        // Set default values
        resultData.createdAt = new Date();
        
        // Add to results array
        results.push(resultData);
        saveData(DB_KEYS.RESULTS, results);
        
        // Mark fixture as played
        const fixtures = getData(DB_KEYS.FIXTURES);
        const fixtureIndex = fixtures.findIndex(f => 
            f.homePlayerId === resultData.homePlayerId && 
            f.awayPlayerId === resultData.awayPlayerId
        );
        
        if (fixtureIndex !== -1) {
            fixtures[fixtureIndex].played = true;
            fixtures[fixtureIndex].updatedAt = new Date();
            saveData(DB_KEYS.FIXTURES, fixtures);
        }
        
        // Sync with server if online
        if (typeof eflAPI !== 'undefined' && eflAPI.isOnline) {
            await eflAPI.addResult(resultData);
        }
        
        console.log('Result added:', resultData);
        return resultData;
    } catch (error) {
        console.error('Error adding result:', error);
        throw error;
    }
}

async function updateResult(updatedResult) {
    try {
        const results = getData(DB_KEYS.RESULTS);
        const index = results.findIndex(r => r.id === updatedResult.id);
        
        if (index !== -1) {
            updatedResult.updatedAt = new Date();
            results[index] = { ...results[index], ...updatedResult };
            saveData(DB_KEYS.RESULTS, results);
            
            // Sync with server if online
            if (typeof eflAPI !== 'undefined' && eflAPI.isOnline) {
                await eflAPI.updateResult(updatedResult.id, updatedResult);
            }
            
            console.log('Result updated:', updatedResult);
            return updatedResult;
        }
        throw new Error('Result not found');
    } catch (error) {
        console.error('Error updating result:', error);
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
                fixtures[fixtureIndex].updatedAt = new Date();
                saveData(DB_KEYS.FIXTURES, fixtures);
            }
        }
        
        // Sync with server if online
        if (typeof eflAPI !== 'undefined' && eflAPI.isOnline) {
            await eflAPI.deleteResult(resultId);
        }
        
        console.log('Result deleted:', resultId);
        return true;
    } catch (error) {
        console.error('Error deleting result:', error);
        throw error;
    }
}

// Statistics and calculations
function calculatePlayerStats(playerId) {
    const results = getData(DB_KEYS.RESULTS);
    const playerResults = results.filter(r => 
        r.homePlayerId === playerId || r.awayPlayerId === playerId
    );

    let stats = {
        played: playerResults.length,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0
    };

    playerResults.forEach(result => {
        const isHome = result.homePlayerId === playerId;
        const playerScore = isHome ? result.homeScore : result.awayScore;
        const opponentScore = isHome ? result.awayScore : result.homeScore;

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

    return stats;
}

function getLeagueTable() {
    const players = getData(DB_KEYS.PLAYERS);
    const tableData = players.map(player => {
        const stats = calculatePlayerStats(player.id);
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
            goalDifference: stats.goalsFor - stats.goalsAgainst,
            points: stats.points
        };
    });

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
        
        showNotification('Data imported successfully!', 'success');
        return true;
    } catch (error) {
        console.error('Error importing data:', error);
        showNotification('Error importing data!', 'error');
        return false;
    }
}

// Initialize database when script loads
document.addEventListener('DOMContentLoaded', function() {
    initializeDatabase();
    console.log('Database system initialized');
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
window.formatDisplayDate = formatDisplayDate;
window.showNotification = showNotification;
window.updateSyncStatus = updateSyncStatus;
window.initializeDatabase = initializeDatabase;
window.DB_KEYS = DB_KEYS;
window.BALANCED_TEAMS = BALANCED_TEAMS;
