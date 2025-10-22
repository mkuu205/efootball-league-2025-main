// App.js - Fully Online Version
const APP_VERSION = '1.0.5'; // Updated version for online mode

async function initializeApp() {
    console.log('🚀 Initializing fully online application...');
    
    try {
        // Wait for API connection
        await eflAPI.checkConnection();
        
        // Clear any old localStorage cache from previous versions
        const storedVersion = localStorage.getItem('app_version');
        if (storedVersion !== APP_VERSION) {
            console.log('🔄 New version detected, clearing old cache...');
            
            // Clear all old localStorage items
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('efl_') || key.startsWith('app_')) {
                    localStorage.removeItem(key);
                }
            });
            
            // Update version
            localStorage.setItem('app_version', APP_VERSION);
            console.log('✅ Cache cleared for new online version');
        }
        
        console.log('✅ Online application initialized');
        return true;
    } catch (error) {
        console.error('❌ Failed to initialize application:', error);
        showNotification('Failed to initialize app: ' + error.message, 'error');
        return false;
    }
}

// UI Rendering functions for main site - UPDATED FOR ONLINE MODE
async function renderHomePage() {
    try {
        await renderUpcomingMatches();
        await renderTopScorers();
        await renderRecentForm();
        await renderQuickStats();
        
        // Initialize advanced stats if on that tab
        if (typeof advancedStats !== 'undefined' && currentTab === 'advanced-stats') {
            await advancedStats.loadAdvancedStatsDashboard();
        }
        
        // Initialize updates if on that tab
        if (typeof tournamentUpdates !== 'undefined' && currentTab === 'updates') {
            await tournamentUpdates.loadUpdatesDashboard();
        }
    } catch (error) {
        console.error('Error rendering home page:', error);
        showNotification('Error loading home page data', 'error');
    }
}

async function renderUpcomingMatches() {
    try {
        const fixtures = await getData(DB_KEYS.FIXTURES);
        const players = await getData(DB_KEYS.PLAYERS);
        const upcomingFixtures = fixtures.filter(f => !f.played).slice(0, 3);
        
        const container = document.getElementById('upcoming-matches');
        if (!container) return;
        
        if (upcomingFixtures.length === 0) {
            container.innerHTML = '<p class="text-center">No upcoming matches</p>';
            return;
        }
        
        container.innerHTML = upcomingFixtures.map(fixture => {
            const homePlayer = players.find(p => p.id === fixture.homePlayerId);
            const awayPlayer = players.find(p => p.id === fixture.awayPlayerId);
            
            if (!homePlayer || !awayPlayer) return '';
            
            return `
                <div class="match-card">
                    <div class="d-flex align-items-center">
                        <img src="${homePlayer.photo}" alt="${homePlayer.name}" 
                             class="rounded-circle me-2" style="width: 30px; height: 30px; object-fit: cover;"
                             onerror="this.src='${homePlayer.defaultPhoto || 'https://via.placeholder.com/100/1a1a2e/ffffff?text=?'}'">
                        <div class="fw-bold">${homePlayer.name}</div>
                        <span class="mx-2">vs</span>
                        <img src="${awayPlayer.photo}" alt="${awayPlayer.name}" 
                             class="rounded-circle me-2" style="width: 30px; height: 30px; object-fit: cover;"
                             onerror="this.src='${awayPlayer.defaultPhoto || 'https://via.placeholder.com/100/1a1a2e/ffffff?text=?'}'">
                        <div class="fw-bold">${awayPlayer.name}</div>
                    </div>
                    <div class="text-muted">${formatDisplayDate(fixture.date)}, ${fixture.time}</div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error rendering upcoming matches:', error);
        const container = document.getElementById('upcoming-matches');
        if (container) {
            container.innerHTML = '<p class="text-center text-danger">Error loading matches</p>';
        }
    }
}

async function renderTopScorers() {
    try {
        const players = await getData(DB_KEYS.PLAYERS);
        const results = await getData(DB_KEYS.RESULTS);
        
        // Remove duplicate players first
        const uniquePlayers = [];
        const seenPlayerIds = new Set();
        
        players.forEach(player => {
            if (!seenPlayerIds.has(player.id)) {
                seenPlayerIds.add(player.id);
                uniquePlayers.push(player);
            }
        });
        
        // Calculate goals for each unique player
        const playerGoals = uniquePlayers.map(player => {
            let goals = 0;
            results.forEach(result => {
                if (result.homePlayerId === player.id) {
                    goals += result.homeScore;
                }
                if (result.awayPlayerId === player.id) {
                    goals += result.awayScore;
                }
            });
            return { ...player, goals };
        });
        
        // Sort by goals (descending)
        playerGoals.sort((a, b) => b.goals - a.goals);
        
        const container = document.getElementById('top-scorers');
        if (!container) return;
        
        container.innerHTML = playerGoals.slice(0, 5).map((player, index) => `
            <li class="list-group-item d-flex justify-content-between align-items-start bg-transparent text-light border-light">
                <div class="d-flex align-items-center">
                    <span class="badge bg-secondary me-2">${index + 1}</span>
                    <img src="${player.photo}" alt="${player.name}" 
                         class="rounded-circle me-3" style="width: 35px; height: 35px; object-fit: cover;"
                         onerror="this.src='${player.defaultPhoto || 'https://via.placeholder.com/100/1a1a2e/ffffff?text=?'}'">
                    <div>
                        <div class="fw-bold">${player.name}</div>
                        <small class="text-muted">${player.team}</small>
                    </div>
                </div>
                <span class="badge bg-primary rounded-pill">${player.goals} goals</span>
            </li>
        `).join('');
    } catch (error) {
        console.error('Error rendering top scorers:', error);
        const container = document.getElementById('top-scorers');
        if (container) {
            container.innerHTML = '<li class="list-group-item text-center text-danger">Error loading top scorers</li>';
        }
    }
}

async function renderRecentForm() {
    try {
        const players = await getData(DB_KEYS.PLAYERS);
        const results = await getData(DB_KEYS.RESULTS);
        
        // Sort results by date (newest first)
        const sortedResults = [...results].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        const container = document.getElementById('recent-form');
        if (!container) return;
        
        // Remove duplicate players
        const uniquePlayers = [];
        const seenPlayerIds = new Set();
        
        players.forEach(player => {
            if (!seenPlayerIds.has(player.id)) {
                seenPlayerIds.add(player.id);
                uniquePlayers.push(player);
            }
        });
        
        const formHTML = await Promise.all(uniquePlayers.map(async (player) => {
            // Get last 5 matches for this player
            const playerResults = sortedResults.filter(r => 
                r.homePlayerId === player.id || r.awayPlayerId === player.id
            ).slice(0, 5);
            
            const form = playerResults.map(result => {
                const isHome = result.homePlayerId === player.id;
                const playerScore = isHome ? result.homeScore : result.awayScore;
                const opponentScore = isHome ? result.awayScore : result.homeScore;
                
                if (playerScore > opponentScore) return 'W';
                if (playerScore === opponentScore) return 'D';
                return 'L';
            }).reverse(); // Show in chronological order
            
            const formBadges = form.map(result => {
                const badgeClass = result === 'W' ? 'bg-success' : result === 'D' ? 'bg-warning' : 'bg-danger';
                return `<span class="badge ${badgeClass} me-1">${result}</span>`;
            }).join('');
            
            return `
                <div class="d-flex justify-content-between align-items-center mb-2 p-2 rounded" style="background: rgba(255,255,255,0.1);">
                    <div class="d-flex align-items-center">
                        <img src="${player.photo}" alt="${player.name}" 
                             class="rounded-circle me-2" style="width: 30px; height: 30px; object-fit: cover;"
                             onerror="this.src='${player.defaultPhoto || 'https://via.placeholder.com/100/1a1a2e/ffffff?text=?'}'">
                        <span class="fw-bold">${player.name}</span>
                    </div>
                    <div>${formBadges || '<span class="text-muted">No matches</span>'}</div>
                </div>
            `;
        }));
        
        container.innerHTML = formHTML.join('');
    } catch (error) {
        console.error('Error rendering recent form:', error);
        const container = document.getElementById('recent-form');
        if (container) {
            container.innerHTML = '<p class="text-center text-danger">Error loading recent form</p>';
        }
    }
}

// Enhanced Home Tab with Quick Stats
async function renderQuickStats() {
    try {
        const players = await getData(DB_KEYS.PLAYERS);
        const fixtures = await getData(DB_KEYS.FIXTURES);
        const results = await getData(DB_KEYS.RESULTS);
        
        const container = document.getElementById('quick-stats');
        if (!container) return;

        const totalGoals = results.reduce((acc, result) => acc + result.homeScore + result.awayScore, 0);
        const playedMatches = results.length;
        const upcomingMatches = fixtures.filter(f => !f.played).length;
        const avgGoals = playedMatches > 0 ? (totalGoals / playedMatches).toFixed(1) : 0;
        const totalPlayers = players.length;

        container.innerHTML = `
            <div class="row text-center">
                <div class="col-6 mb-3">
                    <div class="h4 text-warning">${playedMatches}</div>
                    <small class="text-muted">Played</small>
                </div>
                <div class="col-6 mb-3">
                    <div class="h4 text-info">${upcomingMatches}</div>
                    <small class="text-muted">Upcoming</small>
                </div>
                <div class="col-6">
                    <div class="h4 text-success">${totalGoals}</div>
                    <small class="text-muted">Total Goals</small>
                </div>
                <div class="col-6">
                    <div class="h4 text-primary">${avgGoals}</div>
                    <small class="text-muted">Avg Goals</small>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error rendering quick stats:', error);
        const container = document.getElementById('quick-stats');
        if (container) {
            container.innerHTML = '<p class="text-center text-danger">Error loading stats</p>';
        }
    }
}

async function renderFixtures() {
    try {
        const fixtures = await getData(DB_KEYS.FIXTURES);
        const players = await getData(DB_KEYS.PLAYERS);
        
        const container = document.getElementById('fixtures-table');
        if (!container) return;
        
        const tbody = container.querySelector('tbody');
        const fixturesHTML = await Promise.all(fixtures.map(async (fixture) => {
            const homePlayer = players.find(p => p.id === fixture.homePlayerId);
            const awayPlayer = players.find(p => p.id === fixture.awayPlayerId);
            
            if (!homePlayer || !awayPlayer) return '';
            
            const statusBadge = fixture.played ? 
                '<span class="badge bg-success">Played</span>' : 
                '<span class="badge bg-warning">Upcoming</span>';
            
            return `
                <tr>
                    <td>${formatDisplayDate(fixture.date)}</td>
                    <td>${fixture.time}</td>
                    <td>
                        <div class="d-flex align-items-center">
                            <img src="${homePlayer.photo}" alt="${homePlayer.name}" 
                                 class="rounded-circle me-2" style="width: 30px; height: 30px; object-fit: cover;"
                                 onerror="this.src='${homePlayer.defaultPhoto || 'https://via.placeholder.com/100/1a1a2e/ffffff?text=?'}'">
                            <div>${homePlayer.name}</div>
                        </div>
                    </td>
                    <td>
                        <div class="d-flex align-items-center">
                            <img src="${awayPlayer.photo}" alt="${awayPlayer.name}" 
                                 class="rounded-circle me-2" style="width: 30px; height: 30px; object-fit: cover;"
                                 onerror="this.src='${awayPlayer.defaultPhoto || 'https://via.placeholder.com/100/1a1a2e/ffffff?text=?'}'">
                            <div>${awayPlayer.name}</div>
                        </div>
                    </td>
                    <td>${fixture.venue}</td>
                    <td>${statusBadge}</td>
                </tr>
            `;
        }));
        
        tbody.innerHTML = fixturesHTML.join('');
    } catch (error) {
        console.error('Error rendering fixtures:', error);
        const container = document.getElementById('fixtures-table');
        if (container) {
            container.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error loading fixtures</td></tr>';
        }
    }
}

async function renderResults() {
    try {
        const results = await getData(DB_KEYS.RESULTS);
        const players = await getData(DB_KEYS.PLAYERS);
        
        // Sort by date (newest first)
        const sortedResults = [...results].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        const container = document.getElementById('results-container');
        if (!container) return;
        
        const resultsHTML = await Promise.all(sortedResults.map(async (result) => {
            const homePlayer = players.find(p => p.id === result.homePlayerId);
            const awayPlayer = players.find(p => p.id === result.awayPlayerId);
            
            if (!homePlayer || !awayPlayer) return '';
            
            return `
                <div class="match-card">
                    <div class="d-flex align-items-center justify-content-between">
                        <div class="d-flex align-items-center">
                            <img src="${homePlayer.photo}" alt="${homePlayer.name}" 
                                 class="rounded-circle me-2" style="width: 40px; height: 40px; object-fit: cover;"
                                 onerror="this.src='${homePlayer.defaultPhoto || 'https://via.placeholder.com/100/1a1a2e/ffffff?text=?'}'">
                            <div class="fw-bold">${homePlayer.name}</div>
                        </div>
                        <div class="match-result">${result.homeScore} - ${result.awayScore}</div>
                        <div class="d-flex align-items-center">
                            <img src="${awayPlayer.photo}" alt="${awayPlayer.name}" 
                                 class="rounded-circle me-2" style="width: 40px; height: 40px; object-fit: cover;"
                                 onerror="this.src='${awayPlayer.defaultPhoto || 'https://via.placeholder.com/100/1a1a2e/ffffff?text=?'}'">
                            <div class="fw-bold">${awayPlayer.name}</div>
                        </div>
                    </div>
                    <div class="text-muted text-center mt-2">${formatDisplayDate(result.date)}</div>
                </div>
            `;
        }));
        
        container.innerHTML = resultsHTML.join('');
    } catch (error) {
        console.error('Error rendering results:', error);
        const container = document.getElementById('results-container');
        if (container) {
            container.innerHTML = '<p class="text-center text-danger">Error loading results</p>';
        }
    }
}

// Enhanced League Table with Form
async function renderLeagueTable() {
    try {
        const tableData = await getLeagueTable();
        
        const container = document.getElementById('league-table');
        if (!container) return;
        
        const tbody = container.querySelector('tbody');
        const tableHTML = await Promise.all(tableData.map(async (player, index) => {
            const positionClass = index === 0 ? 'position-1' : index === 1 ? 'position-2' : index === 2 ? 'position-3' : '';
            const players = await getData(DB_KEYS.PLAYERS);
            const playerData = players.find(p => p.id === player.id);
            
            if (!playerData) return '';
            
            // Get recent form
            const form = await getRecentForm(player.id);
            const formBadges = form.map(result => {
                const badgeClass = result === 'W' ? 'bg-success' : result === 'D' ? 'bg-warning' : 'bg-danger';
                return `<span class="badge ${badgeClass} me-1" style="font-size: 0.6rem;">${result}</span>`;
            }).join('');

            return `
                <tr class="${positionClass}">
                    <td class="text-center fw-bold">${index + 1}</td>
                    <td>
                        <div class="d-flex align-items-center">
                            <img src="${playerData.photo}" alt="${player.name}" 
                                 class="rounded-circle me-3" style="width: 35px; height: 35px; object-fit: cover;"
                                 onerror="this.src='${playerData.defaultPhoto || 'https://via.placeholder.com/100/1a1a2e/ffffff?text=?'}'">
                            <div>
                                <div class="fw-bold">${player.name}</div>
                                <small class="text-muted">${player.team}</small>
                            </div>
                        </div>
                    </td>
                    <td class="text-center">${player.played}</td>
                    <td class="text-center">${player.wins}</td>
                    <td class="text-center">${player.draws}</td>
                    <td class="text-center">${player.losses}</td>
                    <td class="text-center">${player.goalsFor}</td>
                    <td class="text-center">${player.goalsAgainst}</td>
                    <td class="text-center ${player.goalDifference > 0 ? 'text-success' : player.goalDifference < 0 ? 'text-danger' : ''}">
                        ${player.goalDifference > 0 ? '+' : ''}${player.goalDifference}
                    </td>
                    <td class="text-center fw-bold text-warning">${player.points}</td>
                    <td class="text-center">${formBadges || '<span class="text-muted">-</span>'}</td>
                </tr>
            `;
        }));
        
        tbody.innerHTML = tableHTML.join('');
    } catch (error) {
        console.error('Error rendering league table:', error);
        const container = document.getElementById('league-table');
        if (container) {
            container.innerHTML = '<tr><td colspan="11" class="text-center text-danger">Error loading league table</td></tr>';
        }
    }
}

async function renderPlayers() {
    try {
        const players = await getData(DB_KEYS.PLAYERS);
        const tableData = await getLeagueTable();
        
        const container = document.getElementById('players-container');
        if (!container) return;
        
        // Remove duplicate players
        const uniquePlayers = [];
        const seenPlayerIds = new Set();
        
        players.forEach(player => {
            if (!seenPlayerIds.has(player.id)) {
                seenPlayerIds.add(player.id);
                uniquePlayers.push(player);
            }
        });
        
        const playersHTML = await Promise.all(uniquePlayers.map(async (player) => {
            const stats = await calculatePlayerStats(player.id);
            const position = tableData.findIndex(p => p.id === player.id) + 1;
            
            return `
                <div class="col-md-6 col-lg-4 mb-4">
                    <div class="card player-card text-center">
                        <div class="card-body">
                            <img src="${player.photo}" class="player-photo mb-3" alt="${player.name}" 
                                 onerror="this.src='${player.defaultPhoto || 'https://via.placeholder.com/100/1a1a2e/ffffff?text=?'}'">
                            <h5 class="card-title player-name">${player.name}</h5>
                            <p class="card-text">
                                <span class="badge" style="background-color: ${player.teamColor || '#6c757d'}; color: white;">
                                    ${player.team}
                                </span>
                            </p>
                            <p class="card-text">Position: ${position}</p>
                            <div class="d-flex justify-content-around mt-3">
                                <div>
                                    <div class="fw-bold">${stats.goalsFor}</div>
                                    <small>Goals</small>
                                </div>
                                <div>
                                    <div class="fw-bold">${stats.wins}</div>
                                    <small>Wins</small>
                                </div>
                                <div>
                                    <div class="fw-bold">${stats.points}</div>
                                    <small>Points</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }));
        
        container.innerHTML = playersHTML.join('');
    } catch (error) {
        console.error('Error rendering players:', error);
        const container = document.getElementById('players-container');
        if (container) {
            container.innerHTML = '<p class="text-center text-danger">Error loading players</p>';
        }
    }
}

// Fixed Countdown Timer - Updated for online mode
async function updateCountdown() {
    try {
        const fixtures = await getData(DB_KEYS.FIXTURES);
        const upcomingFixtures = fixtures.filter(f => !f.played);
        
        if (upcomingFixtures.length === 0) {
            const timer = document.getElementById('countdown-timer');
            if (timer) timer.textContent = 'No upcoming matches';
            return;
        }
        
        // Find the next fixture by date and time
        const now = new Date();
        let nextFixture = null;
        let smallestDiff = Infinity;
        
        upcomingFixtures.forEach(fixture => {
            const [year, month, day] = fixture.date.split('-');
            const [hours, minutes] = fixture.time.split(':');
            
            const fixtureDateTime = new Date(
                parseInt(year),
                parseInt(month) - 1,
                parseInt(day),
                parseInt(hours),
                parseInt(minutes),
                0
            );
            
            const diff = fixtureDateTime - now;
            
            if (diff > 0 && diff < smallestDiff) {
                smallestDiff = diff;
                nextFixture = fixture;
            }
        });
        
        if (!nextFixture) {
            const timer = document.getElementById('countdown-timer');
            if (timer) timer.textContent = 'No upcoming matches';
            return;
        }
        
        const [year, month, day] = nextFixture.date.split('-');
        const [hours, minutes] = nextFixture.time.split(':');
        
        const nextFixtureDateTime = new Date(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day),
            parseInt(hours),
            parseInt(minutes),
            0
        );
        
        const diff = nextFixtureDateTime - new Date();
        
        if (diff <= 0) {
            const timer = document.getElementById('countdown-timer');
            if (timer) timer.textContent = 'LIVE';
            return;
        }
        
        const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
        const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secondsLeft = Math.floor((diff % (1000 * 60)) / 1000);
        
        const timer = document.getElementById('countdown-timer');
        if (timer) {
            timer.textContent = 
                `${hoursLeft.toString().padStart(2, '0')}:${minutesLeft.toString().padStart(2, '0')}:${secondsLeft.toString().padStart(2, '0')}`;
        }
    } catch (error) {
        console.error('Error updating countdown:', error);
        const timer = document.getElementById('countdown-timer');
        if (timer) timer.textContent = 'Error';
    }
}

// Data Sync Check - Updated for online mode
async function checkDataSync() {
    try {
        // Simply check if we can connect to the API
        await eflAPI.checkConnection();
        // If we get here, we're connected
    } catch (error) {
        console.warn('Data sync check failed:', error);
        showNotification('Connection to server lost', 'warning');
    }
}

// Navigation
let currentTab = 'home';

async function showTab(tabName) {
    currentTab = tabName;
    
    // Hide all tabs
    document.querySelectorAll('.tab-pane').forEach(tab => {
        tab.classList.remove('show', 'active');
    });
    
    // Show selected tab
    const tab = document.getElementById(tabName);
    if (tab) {
        tab.classList.add('show', 'active');
        
        // Render content for the tab if needed
        try {
            switch(tabName) {
                case 'home':
                    await renderHomePage();
                    break;
                case 'fixtures':
                    await renderFixtures();
                    break;
                case 'results':
                    await renderResults();
                    break;
                case 'table':
                    await renderLeagueTable();
                    break;
                case 'players':
                    await renderPlayers();
                    break;
                case 'advanced-stats':
                    if (typeof advancedStats !== 'undefined') {
                        await advancedStats.loadAdvancedStatsDashboard();
                    }
                    break;
                case 'updates':
                    if (typeof tournamentUpdates !== 'undefined') {
                        await tournamentUpdates.loadUpdatesDashboard();
                    }
                    break;
            }
        } catch (error) {
            console.error(`Error rendering tab ${tabName}:`, error);
            showNotification(`Error loading ${tabName} data`, 'error');
        }
    }
}

// Event Listeners for main site
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('[data-tab]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const tabName = this.getAttribute('data-tab');
            showTab(tabName);
            
            // Update active nav link
            document.querySelectorAll('.nav-link').forEach(navLink => {
                navLink.classList.remove('active');
            });
            this.classList.add('active');
        });
    });
    
    // Manual refresh button
    const refreshBtn = document.getElementById('manual-refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            try {
                showNotification('Refreshing data...', 'info');
                eflAPI.clearCache();
                await refreshAllDisplays();
                showNotification('Data refreshed successfully', 'success');
            } catch (error) {
                console.error('Manual refresh failed:', error);
                showNotification('Refresh failed: ' + error.message, 'error');
            }
        });
    }
    
    // Initialize advanced features
    if (typeof advancedStats !== 'undefined') {
        advancedStats.setupEventListeners();
    }
    
    if (typeof tournamentUpdates !== 'undefined') {
        tournamentUpdates.setupEventListeners();
    }
    
    if (typeof bulkOperations !== 'undefined') {
        bulkOperations.setupAdminEventListeners();
    }
}

// Initialize the main application
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🎯 Starting fully online application...');
    
    try {
        // Initialize app first
        await initializeApp();
        
        // Setup event listeners
        setupEventListeners();
        
        // Show home tab
        await showTab('home');
        
        // Set up countdown timer
        setInterval(updateCountdown, 1000);
        updateCountdown();
        
        // Check connection every 2 minutes
        setInterval(checkDataSync, 120000);
        
        // Update sync status
        updateSyncStatus();
        
        console.log('✅ Application fully initialized in online mode');
        showNotification('Application ready - Fully online mode', 'success');
        
    } catch (error) {
        console.error('❌ Failed to start application:', error);
        showNotification('Failed to start application: ' + error.message, 'error');
    }
});

// Auto-close navbar on mobile when links are clicked
document.addEventListener('DOMContentLoaded', function() {
    const navbarCollapse = document.querySelector('.navbar-collapse');
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth < 992) {
                const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
                if (bsCollapse) {
                    bsCollapse.hide();
                }
            }
        });
    });
});
