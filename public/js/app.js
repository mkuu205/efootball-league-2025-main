// app.js - Fixed with Enhanced Avatar Handling
import {
    getData,
    getPlayerById,
    getLeagueTable,
    calculatePlayerStats,
    formatDisplayDate,
    DB_KEYS,
    refreshAllDisplays
} from './database.js';

// Cache and Version Control
const APP_VERSION = '3.0.0';

// Enhanced avatar helper function with better fallback
function getPlayerAvatar(player, size = 40) {
    // If player has a valid photo URL, use it
    if (player?.photo && player.photo.startsWith('http')) {
        return player.photo;
    }

    // Otherwise generate avatar from name
    const initial = player?.name?.charAt(0)?.toUpperCase() || 'P';
    return `https://ui-avatars.com/api/?name=${initial}&background=6a11cb&color=fff&size=${size}`;
}

async function initializeApp() {
    console.log('⚡ Initializing app with Supabase...');
    await refreshAllDisplays();
    localStorage.setItem('efl_last_update', new Date().toISOString());
}

// Initialize app
initializeApp();

// UI Rendering functions
export async function renderHomePage() {
    await renderUpcomingMatches();
    await renderTopScorers();
    await renderRecentForm();
    await renderQuickStats();

    if (typeof advancedStats !== 'undefined' && currentTab === 'advanced-stats') {
        await advancedStats.loadAdvancedStatsDashboard();
    }
}

export async function renderUpcomingMatches() {
    const fixtures = await getData(DB_KEYS.FIXTURES);
    const players = await getData(DB_KEYS.PLAYERS);

    if (!Array.isArray(fixtures) || !Array.isArray(players)) {
        console.error('Invalid data format for fixtures or players');
        return;
    }

    const upcomingFixtures = fixtures.filter(f => !f.played).slice(0, 3);

    const container = document.getElementById('upcoming-matches');
    if (!container) return;

    if (upcomingFixtures.length === 0) {
        container.innerHTML = '<p class="text-center">No upcoming matches</p>';
        return;
    }

    container.innerHTML = upcomingFixtures.map(fixture => {
        const homePlayer = players.find(p => p.id === fixture.home_player_id);
        const awayPlayer = players.find(p => p.id === fixture.away_player_id);

        if (!homePlayer || !awayPlayer) return '';

        return `
            <div class="match-card">
                <div class="d-flex align-items-center">
                    <img src="${homePlayer.photo || getPlayerAvatar(homePlayer)}" alt="${homePlayer.name}" 
                         class="rounded-circle me-2" style="width: 30px; height: 30px; object-fit: cover;"
                         onerror="this.src='${getPlayerAvatar(homePlayer)}'">
                    <div class="fw-bold">${homePlayer.name}</div>
                    <span class="mx-2">vs</span>
                    <img src="${awayPlayer.photo || getPlayerAvatar(awayPlayer)}" alt="${awayPlayer.name}" 
                         class="rounded-circle me-2" style="width: 30px; height: 30px; object-fit: cover;"
                         onerror="this.src='${getPlayerAvatar(awayPlayer)}'">
                    <div class="fw-bold">${awayPlayer.name}</div>
                </div>
                <div class="text-muted">${formatDisplayDate(fixture.date)}, ${fixture.time}</div>
            </div>
        `;
    }).join('');
}

export async function renderTopScorers() {
    const players = await getData(DB_KEYS.PLAYERS);
    const results = await getData(DB_KEYS.RESULTS);

    if (!Array.isArray(players) || !Array.isArray(results)) {
        console.error('Invalid data format for players or results');
        return;
    }

    const playerGoals = players.map((player) => {
        let goals = 0;
        results.forEach(result => {
            if (result.home_player_id === player.id) {
                goals += result.home_score || 0;
            }
            if (result.away_player_id === player.id) {
                goals += result.away_score || 0;
            }
        });
        return { ...player, goals };
    });

    playerGoals.sort((a, b) => b.goals - a.goals);

    const container = document.getElementById('top-scorers');
    if (!container) return;

    container.innerHTML = playerGoals.slice(0, 5).map((player, index) => `
        <li class="list-group-item d-flex justify-content-between align-items-start bg-transparent border-0" style="border-bottom: 1px solid rgba(6, 182, 212, 0.2) !important; padding: 1rem 0;">
            <div class="d-flex align-items-center">
                <img src="${player.photo || getPlayerAvatar(player)}" alt="${player.name}" 
                     class="rounded-circle me-3" style="width: 40px; height: 40px; object-fit: cover; border: 2px solid rgba(6, 182, 212, 0.5);"
                     onerror="this.src='${getPlayerAvatar(player)}'">
                <div>
                    <div class="fw-bold" style="color: #F8FAFC;">${player.name}</div>
                    <small style="color: #94A3B8;">${player.team}</small>
                </div>
            </div>
            <span class="badge rounded-pill" style="background: linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%); padding: 0.5rem 1rem; font-size: 0.9rem;">${player.goals} goals</span>
        </li>
    `).join('');
}


export async function renderRecentForm() {
    const players = await getData(DB_KEYS.PLAYERS);
    const results = await getData(DB_KEYS.RESULTS);

    if (!Array.isArray(players) || !Array.isArray(results)) {
        console.error('Invalid data format for players or results');
        return;
    }

    const sortedResults = [...results].sort((a, b) => new Date(b.date) - new Date(a.date));

    const container = document.getElementById('recent-form');
    if (!container) return;

    const formHTML = await Promise.all(players.slice(0, 5).map(async (player) => {
        const playerResults = sortedResults.filter(r =>
            r.home_player_id === player.id || r.away_player_id === player.id
        ).slice(0, 5);

        const form = playerResults.map(result => {
            const isHome = result.home_player_id === player.id;
            const playerScore = isHome ? result.home_score : result.away_score;
            const opponentScore = isHome ? result.away_score : result.home_score;

            if (playerScore > opponentScore) return 'W';
            if (playerScore === opponentScore) return 'D';
            return 'L';
        }).reverse();

        const formBadges = form.map(result => {
            const badgeClass = result === 'W' ? 'bg-success' : result === 'D' ? 'bg-warning' : 'bg-danger';
            return `<span class="badge ${badgeClass} me-1">${result}</span>`;
        }).join('');

        return `
            <div class="d-flex justify-content-between align-items-center mb-2 p-2 rounded" style="background: rgba(6, 182, 212, 0.1); border: 1px solid rgba(6, 182, 212, 0.2);">
                <div class="d-flex align-items-center">
                    <img src="${player.photo || getPlayerAvatar(player)}" alt="${player.name}" 
                         class="rounded-circle me-2" style="width: 30px; height: 30px; object-fit: cover;"
                         onerror="this.src='${getPlayerAvatar(player)}'">
                    <span class="fw-bold" style="color: #F8FAFC;">${player.name}</span>
                </div>
                <div>${formBadges || '<span style="color: #CBD5E1;">No matches</span>'}</div>
            </div>
        `;
    }));

    container.innerHTML = formHTML.join('');
}


export async function renderQuickStats() {
    const players = await getData(DB_KEYS.PLAYERS);
    const fixtures = await getData(DB_KEYS.FIXTURES);
    const results = await getData(DB_KEYS.RESULTS);

    const container = document.getElementById('quick-stats');
    if (!container) return;

    const totalGoals = results.reduce((acc, result) => acc + (result.home_score || 0) + (result.away_score || 0), 0);
    const playedMatches = results.length;
    const upcomingMatches = fixtures.filter(f => !f.played).length;
    const avgGoals = playedMatches > 0 ? (totalGoals / playedMatches).toFixed(1) : 0;

    container.innerHTML = `
        <div class="row text-center">
            <div class="col-6 mb-3">
                <div class="h2 fw-bold" style="color: #F97316; text-shadow: 0 0 20px rgba(249, 115, 22, 0.5);">${playedMatches}</div>
                <small style="color: #CBD5E1; font-weight: 600;">Played</small>
            </div>
            <div class="col-6 mb-3">
                <div class="h2 fw-bold" style="color: #06B6D4; text-shadow: 0 0 20px rgba(6, 182, 212, 0.5);">${upcomingMatches}</div>
                <small style="color: #CBD5E1; font-weight: 600;">Upcoming</small>
            </div>
            <div class="col-6">
                <div class="h2 fw-bold" style="color: #10B981; text-shadow: 0 0 20px rgba(16, 185, 129, 0.5);">${totalGoals}</div>
                <small style="color: #CBD5E1; font-weight: 600;">Total Goals</small>
            </div>
            <div class="col-6">
                <div class="h2 fw-bold" style="color: #3B82F6; text-shadow: 0 0 20px rgba(59, 130, 246, 0.5);">${avgGoals}</div>
                <small style="color: #CBD5E1; font-weight: 600;">Avg Goals</small>
            </div>
        </div>
    `;
}


export async function renderFixtures() {
    const fixtures = await getData(DB_KEYS.FIXTURES);
    const players = await getData(DB_KEYS.PLAYERS);

    const container = document.getElementById('fixtures-table');
    if (!container) return;

    const tbody = container.querySelector('tbody');
    tbody.innerHTML = fixtures.map(fixture => {
        const homePlayer = players.find(p => p.id === fixture.home_player_id);
        const awayPlayer = players.find(p => p.id === fixture.away_player_id);

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
                        <img src="${homePlayer.photo || getPlayerAvatar(homePlayer)}" alt="${homePlayer.name}" 
                             class="rounded-circle me-2" style="width: 30px; height: 30px; object-fit: cover;"
                             onerror="this.src='${getPlayerAvatar(homePlayer)}'">
                        <div>${homePlayer.name}</div>
                    </div>
                </td>
                <td>
                    <div class="d-flex align-items-center">
                        <img src="${awayPlayer.photo || getPlayerAvatar(awayPlayer)}" alt="${awayPlayer.name}" 
                             class="rounded-circle me-2" style="width: 30px; height: 30px; object-fit: cover;"
                             onerror="this.src='${getPlayerAvatar(awayPlayer)}'">
                        <div>${awayPlayer.name}</div>
                    </div>
                </td>
                <td>${fixture.venue}</td>
                <td>${statusBadge}</td>
            </tr>
        `;
    }).join('');
}

export async function renderResults() {
    const results = await getData(DB_KEYS.RESULTS);
    const players = await getData(DB_KEYS.PLAYERS);

    const sortedResults = [...results].sort((a, b) => new Date(b.date) - new Date(a.date));

    const container = document.getElementById('results-container');
    if (!container) return;

    container.innerHTML = sortedResults.map(result => {
        const homePlayer = players.find(p => p.id === result.home_player_id);
        const awayPlayer = players.find(p => p.id === result.away_player_id);

        if (!homePlayer || !awayPlayer) return '';

        return `
            <div class="match-card">
                <div class="d-flex align-items-center justify-content-between">
                    <div class="d-flex align-items-center">
                        <img src="${homePlayer.photo || getPlayerAvatar(homePlayer)}" alt="${homePlayer.name}" 
                             class="rounded-circle me-2" style="width: 40px; height: 40px; object-fit: cover;"
                             onerror="this.src='${getPlayerAvatar(homePlayer)}'">
                        <div class="fw-bold">${homePlayer.name}</div>
                    </div>
                    <div class="match-result">${result.home_score || 0} - ${result.away_score || 0}</div>
                    <div class="d-flex align-items-center">
                        <img src="${awayPlayer.photo || getPlayerAvatar(awayPlayer)}" alt="${awayPlayer.name}" 
                             class="rounded-circle me-2" style="width: 40px; height: 40px; object-fit: cover;"
                             onerror="this.src='${getPlayerAvatar(awayPlayer)}'">
                        <div class="fw-bold">${awayPlayer.name}</div>
                    </div>
                </div>
                <div class="text-muted text-center mt-2">${formatDisplayDate(result.date)}</div>
            </div>
        `;
    }).join('');
}

export async function renderLeagueTable() {
    try {
        const tableData = await getLeagueTable();
        const players = await getData(DB_KEYS.PLAYERS);

        const container = document.getElementById('league-table');
        if (!container) return;

        const tbody = container.querySelector('tbody');
        if (!tbody) return;

        if (!Array.isArray(players)) {
            console.error('Players data is not an array:', players);
            tbody.innerHTML = '<tr><td colspan="11" class="text-center text-danger">Error loading player data</td></tr>';
            return;
        }

        tbody.innerHTML = tableData.map((player, index) => {
            const positionClass = index === 0 ? 'position-1' : index === 1 ? 'position-2' : index === 2 ? 'position-3' : '';
            const playerData = players.find(p => p && p.id === player.id);

            if (!playerData) {
                console.warn('Player data not found for ID:', player.id);
                return '';
            }

            const formBadges = player.form.map(result => {
                const badgeClass = result === 'W' ? 'bg-success' : result === 'D' ? 'bg-warning' : 'bg-danger';
                return `<span class="badge ${badgeClass} me-1" style="font-size: 0.6rem;">${result}</span>`;
            }).join('');

            return `
                <tr class="${positionClass}">
                    <td class="text-center fw-bold">${index + 1}</td>
                    <td>
                        <div class="d-flex align-items-center">
                            <img src="${playerData.photo || getPlayerAvatar(playerData)}" alt="${player.name}" 
                                 class="rounded-circle me-3" style="width: 35px; height: 35px; object-fit: cover;"
                                 onerror="this.src='${getPlayerAvatar(playerData)}'">
                            <div>
                                <div class="fw-bold">${player.name}</div>
                                <small class="text-muted">${player.team}</small>
                            </div>
                        </div>
                    </td>
                    <td class="text-center">${player.played || 0}</td>
                    <td class="text-center">${player.wins || 0}</td>
                    <td class="text-center">${player.draws || 0}</td>
                    <td class="text-center">${player.losses || 0}</td>
                    <td class="text-center">${player.goalsFor || 0}</td>
                    <td class="text-center">${player.goalsAgainst || 0}</td>
                    <td class="text-center ${player.goalDifference > 0 ? 'text-success' : player.goalDifference < 0 ? 'text-danger' : ''}">
                        ${player.goalDifference > 0 ? '+' : ''}${player.goalDifference || 0}
                    </td>
                    <td class="text-center fw-bold text-warning">${player.points || 0}</td>
                    <td class="text-center">${formBadges || '<span class="text-muted">-</span>'}</td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('Error rendering league table:', error);
        const container = document.getElementById('league-table');
        if (container) {
            const tbody = container.querySelector('tbody');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="11" class="text-center text-danger">Error loading league table</td></tr>';
            }
        }
    }
}

export async function renderPlayers() {
    const players = await getData(DB_KEYS.PLAYERS);
    const tableData = await getLeagueTable();

    const container = document.getElementById('players-container');
    if (!container) return;

    const playersHTML = await Promise.all(players.map(async (player) => {
        const stats = await calculatePlayerStats(player.id);
        const position = tableData.findIndex(p => p.id === player.id) + 1;

        return `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card player-card text-center">
                    <div class="card-body">
                        <img src="${player.photo || getPlayerAvatar(player, 100)}" 
                             class="player-photo mb-3" 
                             alt="${player.name}" 
                             style="width: 100px; height: 100px; object-fit: cover; border-radius: 50%;"
                             onerror="this.src='${getPlayerAvatar(player, 100)}'">
                        <h5 class="card-title player-name">${player.name}</h5>
                        <p class="card-text">
                            <span class="badge" style="background-color: ${player.team_color || player.teamColor || '#6c757d'}; color: white;">
                                ${player.team}
                            </span>
                        </p>
                        <p class="card-text">Position: ${position}</p>
                        <div class="d-flex justify-content-around mt-3">
                            <div>
                                <div class="fw-bold">${stats.goalsFor || 0}</div>
                                <small>Goals</small>
                            </div>
                            <div>
                                <div class="fw-bold">${stats.wins || 0}</div>
                                <small>Wins</small>
                            </div>
                            <div>
                                <div class="fw-bold">${stats.points || 0}</div>
                                <small>Points</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }));

    container.innerHTML = playersHTML.join('');
}

// Fixed Countdown Timer
export async function updateCountdown() {
    const fixtures = await getData(DB_KEYS.FIXTURES);
    const upcomingFixtures = fixtures.filter(f => !f.played);

    if (upcomingFixtures.length === 0) {
        const timer = document.getElementById('countdown-timer');
        if (timer) timer.textContent = 'No upcoming matches';
        return;
    }

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
}

// Navigation
export let currentTab = 'home';

export async function showTab(tabName) {
    currentTab = tabName;

    document.querySelectorAll('.tab-pane').forEach(tab => {
        tab.classList.remove('show', 'active');
    });

    const tab = document.getElementById(tabName);
    if (tab) {
        tab.classList.add('show', 'active');

        switch (tabName) {
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
        }
    }
}

// Event Listeners for main site
export function setupEventListeners() {
    document.querySelectorAll('[data-tab]').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const tabName = this.getAttribute('data-tab');
            showTab(tabName);

            document.querySelectorAll('.nav-link').forEach(navLink => {
                navLink.classList.remove('active');
            });
            this.classList.add('active');
        });
    });

    setInterval(updateCountdown, 1000);
    updateCountdown();
}

// Initialize the main application
document.addEventListener('DOMContentLoaded', function () {
    setupEventListeners();
    showTab('home');
});

// Auto-close navbar on mobile when links are clicked
document.addEventListener('DOMContentLoaded', function () {
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

// Make functions globally available for onclick events
window.renderHomePage = renderHomePage;
window.renderFixtures = renderFixtures;
window.renderResults = renderResults;
window.renderLeagueTable = renderLeagueTable;
window.renderPlayers = renderPlayers;
window.showTab = showTab;
window.updateCountdown = updateCountdown;
