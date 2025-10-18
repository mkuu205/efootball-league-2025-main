// Database structure
const DB_KEYS = {
    PLAYERS: 'efl_players',
    FIXTURES: 'efl_fixtures',
    RESULTS: 'efl_results',
    ADMIN_AUTH: 'efl_admin_auth'
};

// Updated players data with direct image URLs
const REAL_PLAYERS = [
    { 
        id: 1, 
        name: 'alwaysresistance', 
        team: 'Kenya', 
        photo: 'https://i.ibb.co/0jmt3HXf/alwaysresistance.jpg',
        strength: 3138,
        defaultPhoto: 'https://i.ibb.co/0jmt3HXf/alwaysresistance.jpg',
        teamColor: '#000000'
    },
    { 
        id: 2, 
        name: 'lildrip035', 
        team: 'Chelsea', 
        photo: 'https://i.ibb.co/CcXdyfc/lildrip035.jpg',
        strength: 3100,
        defaultPhoto: 'https://i.ibb.co/CcXdyfc/lildrip035.jpg',
        teamColor: '#034694'
    },
    { 
        id: 3, 
        name: 'Sergent white', 
        team: 'Chelsea', 
        photo: 'https://i.ibb.co/TD6HHksv/sergent-white.jpg',
        strength: 3042,
        defaultPhoto: 'https://i.ibb.co/TD6HHksv/sergent-white.jpg',
        teamColor: '#034694'
    },
    { 
        id: 4, 
        name: 'skangaKe254', 
        team: 'Liverpool', 
        photo: 'https://i.ibb.co/Wv5nbZRy/skanga-Ke254.jpg',
        strength: 2700,
        defaultPhoto: 'https://i.ibb.co/Wv5nbZRy/skanga-Ke254.jpg',
        teamColor: '#c8102e'
    },
    { 
        id: 5, 
        name: 'Drexas', 
        team: 'Everton', 
        photo: 'https://i.ibb.co/2mzRJVn/drexas.jpg',
        strength: 2792,
        defaultPhoto: 'https://i.ibb.co/2mzRJVn/drexas.jpg',
        teamColor: '#003399'
    },
    { 
        id: 6, 
        name: 'Collo leevan', 
        team: 'Manchester United', 
        photo: 'https://i.ibb.co/nqyFvzvf/collo-leevan.jpg',
        strength: 2448,
        defaultPhoto: 'https://i.ibb.co/nqyFvzvf/collo-leevan.jpg',
        teamColor: '#da291c'
    },
    { 
        id: 7, 
        name: 'captainkenn', 
        team: 'West Ham', 
        photo: 'https://i.ibb.co/35kMmxjW/captainkenn.jpg',
        strength: 3110,
        defaultPhoto: 'https://i.ibb.co/35kMmxjW/captainkenn.jpg',
        teamColor: '#7c2c3b'
    }
];

// Updated team options with correct teams
const BALANCED_TEAMS = [
    { name: 'Kenya', strength: 3150, color: '#000000' },
    { name: 'Chelsea', strength: 3120, color: '#034694' },
    { name: 'Liverpool', strength: 3100, color: '#c8102e' },
    { name: 'Everton', strength: 3080, color: '#003399' },
    { name: 'Manchester United', strength: 3050, color: '#da291c' },
    { name: 'West Ham', strength: 3020, color: '#7c2c3b' },
    { name: 'Arsenal', strength: 3000, color: '#ef0107' },
    { name: 'Manchester City', strength: 2980, color: '#6caee0' },
    { name: 'Tottenham', strength: 2950, color: '#132257' },
    { name: 'Newcastle', strength: 2920, color: '#241f20' }
];

// Function to clean duplicate players
function cleanDuplicatePlayers() {
    const players = getData(DB_KEYS.PLAYERS);
    
    const uniquePlayers = [];
    const seenPlayerIds = new Set();
    
    players.forEach(player => {
        if (!seenPlayerIds.has(player.id)) {
            seenPlayerIds.add(player.id);
            uniquePlayers.push(player);
        }
    });
    
    // Only save if duplicates were found
    if (uniquePlayers.length < players.length) {
        saveData(DB_KEYS.PLAYERS, uniquePlayers);
        console.log(`Cleaned ${players.length - uniquePlayers.length} duplicate players`);
    }
    
    return uniquePlayers;
}

// Enhanced database sync function
async function syncWithMongoDB() {
    try {
        if (eflAPI.isOnline) {
            console.log('Syncing with MongoDB...');
            
            // Get current data from MongoDB
            const mongoData = await eflAPI.getAllData();
            
            if (mongoData.players && mongoData.players.length > 0) {
                // Update local storage with MongoDB data
                saveData(DB_KEYS.PLAYERS, mongoData.players);
                saveData(DB_KEYS.FIXTURES, mongoData.fixtures);
                saveData(DB_KEYS.RESULTS, mongoData.results);
                
                console.log('Successfully synced with MongoDB');
                return true;
            }
        }
    } catch (error) {
        console.log('MongoDB sync failed, using local data:', error);
    }
    return false;
}

// Initialize database with real players
async function initializeDatabase() {
    try {
        // Try to get data from API first
        const apiData = await eflAPI.getAllData();
        
        if (apiData.players && apiData.players.length > 0) {
            // Use API data
            saveData(DB_KEYS.PLAYERS, apiData.players);
            saveData(DB_KEYS.FIXTURES, apiData.fixtures);
            saveData(DB_KEYS.RESULTS, apiData.results);
            console.log('Database initialized from MongoDB API');
            
            // Clean duplicate players
            cleanDuplicatePlayers();
        } else {
            // If MongoDB is empty, initialize it with sample data
            await eflAPI.initializeDatabase();
            // Then sync again
            await syncWithMongoDB();
        }
    } catch (error) {
        console.log('API not available, using local storage:', error);
        // Fallback to original localStorage initialization
        await initializeLocalDatabase();
    }
}

// Initialize local database
async function initializeLocalDatabase() {
    if (!localStorage.getItem(DB_KEYS.PLAYERS)) {
        localStorage.setItem(DB_KEYS.PLAYERS, JSON.stringify(REAL_PLAYERS));
    }

    if (!localStorage.getItem(DB_KEYS.FIXTURES)) {
        const fixtures = generateSimplifiedFixtures();
        localStorage.setItem(DB_KEYS.FIXTURES, JSON.stringify(fixtures));
    }

    if (!localStorage.getItem(DB_KEYS.RESULTS)) {
        localStorage.setItem(DB_KEYS.RESULTS, JSON.stringify([]));
    }
    
    // Clean duplicate players
    cleanDuplicatePlayers();
}

// Generate SIMPLIFIED fixtures (only 21 instead of 84)
function generateSimplifiedFixtures() {
    const players = getData(DB_KEYS.PLAYERS);
    const fixtures = [];
    let fixtureId = 1;
    
    // Generate dates starting from tomorrow
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);
    
    // Create only one match between each pair (21 fixtures total)
    for (let i = 0; i < players.length; i++) {
        for (let j = i + 1; j < players.length; j++) {
            const matchDate = new Date(startDate);
            matchDate.setDate(matchDate.getDate() + (fixtureId - 1) * 2);
            
            fixtures.push({
                id: fixtureId++,
                homePlayerId: players[i].id,
                awayPlayerId: players[j].id,
                date: matchDate.toISOString().split('T')[0],
                time: '15:00',
                venue: 'Virtual Stadium ' + String.fromCharCode(65 + (fixtureId % 3)),
                played: false,
                isHomeLeg: true
            });
        }
    }
    
    return fixtures;
}

// Database operations
function getData(key) {
    return JSON.parse(localStorage.getItem(key)) || [];
}

function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
    localStorage.setItem('efl_last_update', new Date().toISOString());
}

async function addPlayer(player) {
    try {
        const newPlayer = await eflAPI.addPlayer(player);
        const players = getData(DB_KEYS.PLAYERS);
        players.push(newPlayer);
        saveData(DB_KEYS.PLAYERS, players);
        
        // Clean duplicates after adding
        cleanDuplicatePlayers();
        return newPlayer;
    } catch (error) {
        console.log('API failed, using localStorage:', error);
        const players = getData(DB_KEYS.PLAYERS);
        const newId = players.length > 0 ? Math.max(...players.map(p => p.id)) + 1 : 1;
        
        player.id = newId;
        player.strength = player.strength || 2500;
        player.defaultPhoto = `https://via.placeholder.com/100/1a1a2e/ffffff?text=${player.name.charAt(0)}`;
        player.photo = player.photo || player.defaultPhoto;
        
        const availableTeams = BALANCED_TEAMS.filter(team => 
            !players.some(p => p.team === team.name)
        );
        
        if (availableTeams.length > 0) {
            player.team = availableTeams[0].name;
            player.teamColor = availableTeams[0].color;
        } else {
            const randomTeam = BALANCED_TEAMS[Math.floor(Math.random() * BALANCED_TEAMS.length)];
            player.team = randomTeam.name;
            player.teamColor = randomTeam.color;
        }
        
        players.push(player);
        saveData(DB_KEYS.PLAYERS, players);
        
        if (players.length >= 2) {
            const newFixtures = generateSimplifiedFixtures();
            saveData(DB_KEYS.FIXTURES, newFixtures);
        }
        
        // Clean duplicates after adding
        cleanDuplicatePlayers();
        return player;
    }
}

async function updatePlayer(updatedPlayer) {
    try {
        await eflAPI.updatePlayer(updatedPlayer.id, updatedPlayer);
    } catch (error) {
        console.log('API update failed:', error);
    }
    
    const players = getData(DB_KEYS.PLAYERS);
    const index = players.findIndex(p => p.id === updatedPlayer.id);
    if (index !== -1) {
        players[index] = { ...players[index], ...updatedPlayer };
        saveData(DB_KEYS.PLAYERS, players);
        
        // Clean duplicates after updating
        cleanDuplicatePlayers();
        return true;
    }
    return false;
}

async function deletePlayer(id) {
    try {
        await eflAPI.deletePlayer(id);
    } catch (error) {
        console.log('API delete failed:', error);
    }
    
    const players = getData(DB_KEYS.PLAYERS);
    const filteredPlayers = players.filter(p => p.id !== id);
    saveData(DB_KEYS.PLAYERS, filteredPlayers);
    
    const fixtures = getData(DB_KEYS.FIXTURES);
    const filteredFixtures = fixtures.filter(f => 
        f.homePlayerId !== id && f.awayPlayerId !== id
    );
    saveData(DB_KEYS.FIXTURES, filteredFixtures);
    
    const results = getData(DB_KEYS.RESULTS);
    const filteredResults = results.filter(r => 
        r.homePlayerId !== id && r.awayPlayerId !== id
    );
    saveData(DB_KEYS.RESULTS, filteredResults);
    
    return filteredPlayers;
}

async function addFixture(fixture) {
    try {
        const newFixture = await eflAPI.addFixture(fixture);
        const fixtures = getData(DB_KEYS.FIXTURES);
        fixtures.push(newFixture);
        saveData(DB_KEYS.FIXTURES, fixtures);
        return newFixture;
    } catch (error) {
        console.log('API failed, using localStorage:', error);
        const fixtures = getData(DB_KEYS.FIXTURES);
        const newId = fixtures.length > 0 ? Math.max(...fixtures.map(f => f.id)) + 1 : 1;
        fixture.id = newId;
        fixture.played = false;
        fixtures.push(fixture);
        saveData(DB_KEYS.FIXTURES, fixtures);
        return fixture;
    }
}

async function updateFixture(updatedFixture) {
    try {
        await eflAPI.updateFixture(updatedFixture.id, updatedFixture);
    } catch (error) {
        console.log('API update failed:', error);
    }
    
    const fixtures = getData(DB_KEYS.FIXTURES);
    const index = fixtures.findIndex(f => f.id === updatedFixture.id);
    if (index !== -1) {
        fixtures[index] = updatedFixture;
        saveData(DB_KEYS.FIXTURES, fixtures);
        return true;
    }
    return false;
}

async function deleteFixture(id) {
    try {
        await eflAPI.deleteFixture(id);
    } catch (error) {
        console.log('API delete failed:', error);
    }
    
    const fixtures = getData(DB_KEYS.FIXTURES);
    const filteredFixtures = fixtures.filter(f => f.id !== id);
    saveData(DB_KEYS.FIXTURES, filteredFixtures);
    return filteredFixtures;
}

async function addResult(result) {
    try {
        const newResult = await eflAPI.addResult(result);
        const results = getData(DB_KEYS.RESULTS);
        results.push(newResult);
        saveData(DB_KEYS.RESULTS, results);
        
        const fixtures = getData(DB_KEYS.FIXTURES);
        const fixtureIndex = fixtures.findIndex(f => 
            f.homePlayerId === result.homePlayerId && 
            f.awayPlayerId === result.awayPlayerId &&
            !f.played
        );
        
        if (fixtureIndex !== -1) {
            fixtures[fixtureIndex].played = true;
            saveData(DB_KEYS.FIXTURES, fixtures);
        }
        
        return newResult;
    } catch (error) {
        console.log('API failed, using localStorage:', error);
        const results = getData(DB_KEYS.RESULTS);
        const newId = results.length > 0 ? Math.max(...results.map(r => r.id)) + 1 : 1;
        result.id = newId;
        results.push(result);
        saveData(DB_KEYS.RESULTS, results);
        
        const fixtures = getData(DB_KEYS.FIXTURES);
        const fixtureIndex = fixtures.findIndex(f => 
            f.homePlayerId === result.homePlayerId && 
            f.awayPlayerId === result.awayPlayerId &&
            !f.played
        );
        
        if (fixtureIndex !== -1) {
            fixtures[fixtureIndex].played = true;
            saveData(DB_KEYS.FIXTURES, fixtures);
        }
        
        return result;
    }
}

async function updateResult(updatedResult) {
    try {
        await eflAPI.updateResult(updatedResult.id, updatedResult);
    } catch (error) {
        console.log('API update failed:', error);
    }
    
    const results = getData(DB_KEYS.RESULTS);
    const index = results.findIndex(r => r.id === updatedResult.id);
    if (index !== -1) {
        results[index] = updatedResult;
        saveData(DB_KEYS.RESULTS, results);
        return true;
    }
    return false;
}

async function deleteResult(id) {
    try {
        await eflAPI.deleteResult(id);
    } catch (error) {
        console.log('API delete failed:', error);
    }
    
    const results = getData(DB_KEYS.RESULTS);
    const filteredResults = results.filter(r => r.id !== id);
    saveData(DB_KEYS.RESULTS, filteredResults);
    
    const result = results.find(r => r.id === id);
    if (result) {
        const fixtures = getData(DB_KEYS.FIXTURES);
        const fixtureIndex = fixtures.findIndex(f => 
            f.homePlayerId === result.homePlayerId && 
            f.awayPlayerId === result.awayPlayerId
        );
        
        if (fixtureIndex !== -1) {
            fixtures[fixtureIndex].played = false;
            saveData(DB_KEYS.FIXTURES, fixtures);
        }
    }
    
    return filteredResults;
}

// Utility functions
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function getPlayerById(id) {
    const players = getData(DB_KEYS.PLAYERS);
    return players.find(p => p.id === id);
}

function calculatePlayerStats(playerId) {
    const results = getData(DB_KEYS.RESULTS);
    const playerResults = results.filter(r => 
        r.homePlayerId === playerId || r.awayPlayerId === playerId
    );
    
    let played = playerResults.length;
    let wins = 0;
    let draws = 0;
    let losses = 0;
    let goalsFor = 0;
    let goalsAgainst = 0;
    
    playerResults.forEach(result => {
        const isHome = result.homePlayerId === playerId;
        const playerScore = isHome ? result.homeScore : result.awayScore;
        const opponentScore = isHome ? result.awayScore : result.homeScore;
        
        goalsFor += playerScore;
        goalsAgainst += opponentScore;
        
        if (playerScore > opponentScore) {
            wins++;
        } else if (playerScore === opponentScore) {
            draws++;
        } else {
            losses++;
        }
    });
    
    const goalDifference = goalsFor - goalsAgainst;
    const points = wins * 3 + draws;
    
    return {
        played,
        wins,
        draws,
        losses,
        goalsFor,
        goalsAgainst,
        goalDifference,
        points
    };
}

function getLeagueTable() {
    const players = getData(DB_KEYS.PLAYERS);
    const table = players.map(player => {
        const stats = calculatePlayerStats(player.id);
        return {
            id: player.id,
            name: player.name,
            team: player.team,
            strength: player.strength,
            ...stats
        };
    });
    
    return table.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        return b.goalsFor - a.goalsFor;
    });
}

function formatDisplayDate(dateString) {
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show`;
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    const container = document.querySelector('.container');
    if (container) {
        container.insertBefore(notification, container.firstChild);
    }
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

// Initialize database when this script loads
setTimeout(() => {
    initializeDatabase();
}, 1000); 