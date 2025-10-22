// Cache and Version Control
const APP_VERSION = '1.0.4';

function initializeApp() {
    // Check if we need to clear cache
    const storedVersion = localStorage.getItem('app_version');
    
    if (storedVersion !== APP_VERSION) {
        console.log('New version detected, clearing cache...');
        
        // Clear specific cache items or force refresh
        localStorage.removeItem('efl_fixtures_cache');
        localStorage.removeItem('efl_last_update');
        
        // Update version
        localStorage.setItem('app_version', APP_VERSION);
        
        // Force refresh if major version change
        if (!storedVersion) {
            window.location.reload();
        }
    }
    
    // Set last update time
    localStorage.setItem('efl_last_update', new Date().toISOString());
}

// Initialize app version control
initializeApp();

// UI Rendering functions for main site - NO DUPLICATES
function renderHomePage() {
    renderUpcomingMatches();
    renderTopScorers();
    renderRecentForm();
    renderQuickStats();
    
    // Initialize advanced stats if on that tab
    if (typeof advancedStats !== 'undefined' && currentTab === 'advanced-stats') {
        advancedStats.loadAdvancedStatsDashboard();
    }
    
    // Initialize updates if on that tab
    if (typeof tournamentUpdates !== 'undefined' && currentTab === 'updates') {
        tournamentUpdates.loadUpdatesDashboard();
    }
}

function renderUpcomingMatches() {
    const fixtures = getData(DB_KEYS.FIXTURES);
    const players = getData(DB_KEYS.PLAYERS);
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
                         onerror="this.src='${homePlayer.defaultPhoto}'">
                    <div class="fw-bold">${homePlayer.name}</div>
                    <span class="mx-2">vs</span>
                    <img src="${awayPlayer.photo}" alt="${awayPlayer.name}" 
                         class="rounded-circle me-2" style="width: 30px; height: 30px; object-fit: cover;"
                         onerror="this.src='${awayPlayer.defaultPhoto}'">
                    <div class="fw-bold">${awayPlayer.name}</div>
                </div>
                <div class="text-muted">${formatDisplayDate(fixture.date)}, ${fixture.time}</div>
            </div>
        `;
    }).join('');
}

function renderTopScorers() {
    const players = getData(DB_KEYS.PLAYERS);
    const results = getData(DB_KEYS.RESULTS);
    
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
    
    container.innerHTML = playerGoals.map((player, index) => `
        <li class="list-group-item d-flex justify-content-between align-items-start bg-transparent text-light border-light">
            <div class="d-flex align-items-center">
                <img src="${player.photo}" alt="${player.name}" 
                     class="rounded-circle me-3" style="width: 35px; height: 35px; object-fit: cover;"
                     onerror="this.src='${player.defaultPhoto}'">
                <div>
                    <div class="fw-bold">${player.name}</div>
                    <small class="text-muted">${player.team}</small>
                </div>
            </div>
            <span class="badge bg-primary rounded-pill">${player.goals} goals</span>
        </li>
    `).join('');
}

function renderRecentForm() {
    const players = getData(DB_KEYS.PLAYERS);
    const results = getData(DB_KEYS.RESULTS);
    
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
    
    container.innerHTML = uniquePlayers.map(player => {
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
                         onerror="this.src='${player.defaultPhoto}'">
                    <span class="fw-bold">${player.name}</span>
                </div>
                <div>${formBadges || '<span class="text-muted">No matches</span>'}</div>
            </div>
        `;
    }).join('');
}

// Enhanced Home Tab with Quick Stats
function renderQuickStats() {
    const players = getData(DB_KEYS.PLAYERS);
    const fixtures = getData(DB_KEYS.FIXTURES);
    const results = getData(DB_KEYS.RESULTS);
    
    const container = document.getElementById('quick-stats');
    if (!container) return;

    const totalGoals = results.reduce((acc, result) => acc + result.homeScore + result.awayScore, 0);
    const playedMatches = results.length;
    const upcomingMatches = fixtures.filter(f => !f.played).length;
    const avgGoals = playedMatches > 0 ? (totalGoals / playedMatches).toFixed(1) : 0;

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
}

function renderFixtures() {
    const fixtures = getData(DB_KEYS.FIXTURES);
    const players = getData(DB_KEYS.PLAYERS);
    
    const container = document.getElementById('fixtures-table');
    if (!container) return;
    
    const tbody = container.querySelector('tbody');
    tbody.innerHTML = fixtures.map(fixture => {
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
                             onerror="this.src='${homePlayer.defaultPhoto}'">
                        <div>${homePlayer.name}</div>
                    </div>
                </td>
                <td>
                    <div class="d-flex align-items-center">
                        <img src="${awayPlayer.photo}" alt="${awayPlayer.name}" 
                             class="rounded-circle me-2" style="width: 30px; height: 30px; object-fit: cover;"
                             onerror="this.src='${awayPlayer.defaultPhoto}'">
                        <div>${awayPlayer.name}</div>
                    </div>
                </td>
                <td>${fixture.venue}</td>
                <td>${statusBadge}</td>
            </tr>
        `;
    }).join('');
}

function renderResults() {
    const results = getData(DB_KEYS.RESULTS);
    const players = getData(DB_KEYS.PLAYERS);
    
    // Sort by date (newest first)
    const sortedResults = [...results].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const container = document.getElementById('results-container');
    if (!container) return;
    
    container.innerHTML = sortedResults.map(result => {
        const homePlayer = players.find(p => p.id === result.homePlayerId);
        const awayPlayer = players.find(p => p.id === result.awayPlayerId);
        
        if (!homePlayer || !awayPlayer) return '';
        
        return `
            <div class="match-card">
                <div class="d-flex align-items-center justify-content-between">
                    <div class="d-flex align-items-center">
                        <img src="${homePlayer.photo}" alt="${homePlayer.name}" 
                             class="rounded-circle me-2" style="width: 40px; height: 40px; object-fit: cover;"
                             onerror="this.src='${homePlayer.defaultPhoto}'">
                        <div class="fw-bold">${homePlayer.name}</div>
                    </div>
                    <div class="match-result">${result.homeScore} - ${result.awayScore}</div>
                    <div class="d-flex align-items-center">
                        <img src="${awayPlayer.photo}" alt="${awayPlayer.name}" 
                             class="rounded-circle me-2" style="width: 40px; height: 40px; object-fit: cover;"
                             onerror="this.src='${awayPlayer.defaultPhoto}'">
                        <div class="fw-bold">${awayPlayer.name}</div>
                    </div>
                </div>
                <div class="text-muted text-center mt-2">${formatDisplayDate(result.date)}</div>
            </div>
        `;
    }).join('');
}

// Enhanced League Table with Form
function renderLeagueTable() {
    const tableData = getLeagueTable();
    
    const container = document.getElementById('league-table');
    if (!container) return;
    
    const tbody = container.querySelector('tbody');
    tbody.innerHTML = tableData.map((player, index) => {
        const positionClass = index === 0 ? 'position-1' : index === 1 ? 'position-2' : index === 2 ? 'position-3' : '';
        const players = getData(DB_KEYS.PLAYERS);
        const playerData = players.find(p => p.id === player.id);
        
        if (!playerData) return '';
        
        // Get recent form
        const form = getRecentForm(player.id);
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
                             onerror="this.src='${playerData.defaultPhoto}'">
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
    }).join('');
}

// Get recent form for a player
function getRecentForm(playerId) {
    const results = getData(DB_KEYS.RESULTS);
    const playerResults = results.filter(r => 
        r.homePlayerId === playerId || r.awayPlayerId === playerId
    ).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

    return playerResults.map(result => {
        const isHome = result.homePlayerId === playerId;
        const playerScore = isHome ? result.homeScore : result.awayScore;
        const opponentScore = isHome ? result.awayScore : result.homeScore;
        
        if (playerScore > opponentScore) return 'W';
        if (playerScore === opponentScore) return 'D';
        return 'L';
    });
}

function renderPlayers() {
    const players = getData(DB_KEYS.PLAYERS);
    const tableData = getLeagueTable();
    
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
    
    container.innerHTML = uniquePlayers.map(player => {
        const stats = calculatePlayerStats(player.id);
        const position = tableData.findIndex(p => p.id === player.id) + 1;
        
        return `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card player-card text-center">
                    <div class="card-body">
                        <img src="${player.photo}" class="player-photo mb-3" alt="${player.name}" 
                             onerror="this.src='${player.defaultPhoto}'">
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
    }).join('');
}

// Fixed Countdown Timer
function updateCountdown() {
    const fixtures = getData(DB_KEYS.FIXTURES);
    const upcomingFixtures = fixtures.filter(f => !f.played);
    
    if (upcomingFixtures.length === 0) {
        const timer = document.getElementById('countdown-timer');
        if (timer) timer.textContent = 'No upcoming matches';
        return;
    }
    
    // Find the next fixture by date and time - FIXED TIMEZONE ISSUE
    const now = new Date();
    let nextFixture = null;
    let smallestDiff = Infinity;
    
    upcomingFixtures.forEach(fixture => {
        // FIX: Create date in UTC to avoid timezone issues
        const [year, month, day] = fixture.date.split('-');
        const [hours, minutes] = fixture.time.split(':');
        
        // Create date in local timezone but treat as UTC equivalent
        const fixtureDateTime = new Date(
            parseInt(year),
            parseInt(month) - 1, // months are 0-indexed
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
    
    // FIX: Use the same calculation method for consistency
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
    
    const diff = nextFixtureDateTime - new Date(); // Use current local time
    
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
}

// Data Sync Check
function checkDataSync() {
    const lastUpdate = localStorage.getItem('efl_last_update');
    const now = new Date();
    
    if (lastUpdate) {
        const lastUpdateTime = new Date(lastUpdate);
        const diffMinutes = (now - lastUpdateTime) / (1000 * 60);
        
        // If data is older than 5 minutes, suggest refresh
        if (diffMinutes > 5) {
            console.log('Data may be stale, consider refreshing');
        }
    }
}

// Navigation
let currentTab = 'home';

function showTab(tabName) {
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
        switch(tabName) {
            case 'home':
                renderHomePage();
                break;
            case 'fixtures':
                renderFixtures();
                break;
            case 'results':
                renderResults();
                break;
            case 'table':
                renderLeagueTable();
                break;
            case 'players':
                renderPlayers();
                break;
            case 'advanced-stats':
                if (typeof advancedStats !== 'undefined') {
                    advancedStats.loadAdvancedStatsDashboard();
                }
                break;
            case 'updates':
                if (typeof tournamentUpdates !== 'undefined') {
                    tournamentUpdates.loadUpdatesDashboard();
                }
                break;
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
    
    // Fixture filter buttons
    const showUpcomingBtn = document.getElementById('show-upcoming');
    const showAllBtn = document.getElementById('show-all');
    
    if (showUpcomingBtn) {
        showUpcomingBtn.addEventListener('click', function() {
            showNotification('Showing upcoming fixtures', 'info');
        });
    }
    
    if (showAllBtn) {
        showAllBtn.addEventListener('click', function() {
            showNotification('Showing all fixtures', 'info');
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
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    showTab('home');
    
    // Set up countdown timer
    setInterval(updateCountdown, 1000);
    updateCountdown();
    
    // Check data sync every minute
    setInterval(checkDataSync, 60000);
    checkDataSync();
    
    // Initialize sync status
    setTimeout(() => {
        updateSyncStatus();
    }, 2000);
    
    // Initialize advanced features
    if (typeof advancedStats !== 'undefined') {
        setTimeout(() => advancedStats.init(), 1000);
    }
    
    if (typeof tournamentUpdates !== 'undefined') {
        setTimeout(() => tournamentUpdates.init(), 1000);
    }
    
    if (typeof bulkOperations !== 'undefined') {
        setTimeout(() => bulkOperations.init(), 1000);
    }
});

// Auto-close navbar on mobile when links are clicked
document.addEventListener('DOMContentLoaded', function() {
    const navbarCollapse = document.querySelector('.navbar-collapse');
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth < 992) { // Bootstrap lg breakpoint
                const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
                if (bsCollapse) {
                    bsCollapse.hide();
                }
            }
        });
    });
});
