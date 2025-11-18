// admin.js - Simple Admin Functions
import { 
    getData, 
    saveData, 
    DB_KEYS, 
    showNotification,
    supabase,
    initializeDatabase,
    addPlayer,
    addFixture,
    addResult,
    updatePlayer,
    getPlayerById
} from './database.js';

// Simple authentication check
export function checkAdminAuth() {
    const isAuthenticated = sessionStorage.getItem('admin_session') === 'true';
    return isAuthenticated;
}

// Populate player selects
export async function populatePlayerSelects() {
    try {
        const players = await getData(DB_KEYS.PLAYERS);

        const selects = [
            'homePlayerSelect',
            'awayPlayerSelect', 
            'homePlayerResult',
            'awayPlayerResult'
        ];
        
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                select.innerHTML = '<option value="" selected disabled>Select player</option>';
                
                players.forEach(player => {
                    const option = document.createElement('option');
                    option.value = player.id;
                    option.textContent = `${player.name} (${player.team})`;
                    select.appendChild(option);
                });
            }
        });
    } catch (error) {
        console.error('Error populating player selects:', error);
    }
}

// Update admin statistics
export async function updateAdminStatistics() {
    try {
        const players = await getData(DB_KEYS.PLAYERS);
        const fixtures = await getData(DB_KEYS.FIXTURES);
        const results = await getData(DB_KEYS.RESULTS);
        
        // Update counts
        const playersCount = document.getElementById('players-count');
        const fixturesCount = document.getElementById('fixtures-count');
        const resultsCount = document.getElementById('results-count');
        const livePlayers = document.getElementById('live-players');
        const playersBadge = document.getElementById('players-badge');
        const fixturesBadge = document.getElementById('fixtures-badge');
        const resultsBadge = document.getElementById('results-badge');
        
        if (playersCount) playersCount.textContent = players.length;
        if (fixturesCount) fixturesCount.textContent = fixtures.length;
        if (resultsCount) resultsCount.textContent = results.length;
        if (livePlayers) livePlayers.textContent = players.length;
        if (playersBadge) playersBadge.textContent = players.length;
        if (fixturesBadge) fixturesBadge.textContent = fixtures.length;
        if (resultsBadge) resultsBadge.textContent = results.length;
    } catch (error) {
        console.error('Error updating admin statistics:', error);
    }
}

// Render admin players table
export async function renderAdminPlayers() {
    try {
        const players = await getData(DB_KEYS.PLAYERS);
        const tbody = document.querySelector('#players-table tbody');
        
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (players.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">No players found</td></tr>';
            return;
        }
        
        players.forEach(player => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div class="d-flex align-items-center">
                        <img src="${player.photo || 'https://via.placeholder.com/40'}" 
                             alt="${player.name}" class="rounded-circle me-2" width="40" height="40"
                             onerror="this.src='https://via.placeholder.com/40'">
                        <div>
                            <div class="fw-bold">${player.name}</div>
                            <small class="text-muted">ID: ${player.id}</small>
                        </div>
                    </div>
                </td>
                <td>${player.team || 'N/A'}</td>
                <td>${player.strength || 0}</td>
                <td>${player.matches_played || 0}</td>
                <td>${player.points || 0}</td>
                <td>
                    <button class="btn btn-sm btn-outline-warning me-1" onclick="editPlayer(${player.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deletePlayer(${player.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        await updateAdminStatistics();
        
    } catch (error) {
        console.error('Error rendering admin players:', error);
    }
}

// Render admin fixtures table
export async function renderAdminFixtures() {
    try {
        const fixtures = await getData(DB_KEYS.FIXTURES);
        const players = await getData(DB_KEYS.PLAYERS);
        const tbody = document.querySelector('#admin-fixtures-table tbody');
        
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (fixtures.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">No fixtures scheduled</td></tr>';
            return;
        }
        
        fixtures.forEach(fixture => {
            const homePlayer = players.find(p => p.id === fixture.home_player_id);
            const awayPlayer = players.find(p => p.id === fixture.away_player_id);
            const matchDate = new Date(fixture.date);
            const isCompleted = fixture.played;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${matchDate.toLocaleDateString()}</td>
                <td>${fixture.time || 'TBD'}</td>
                <td>${homePlayer?.name || 'Unknown'}</td>
                <td>${awayPlayer?.name || 'Unknown'}</td>
                <td>${fixture.venue || 'TBD'}</td>
                <td>
                    <span class="badge ${isCompleted ? 'bg-success' : 'bg-warning'}">
                        ${isCompleted ? 'Completed' : 'Scheduled'}
                    </span>
                </td>
                <td>
                    ${!isCompleted ? `
                    <button class="btn btn-sm btn-outline-success me-1" onclick="addFixtureResult(${fixture.id})">
                        <i class="fas fa-futbol"></i>
                    </button>
                    ` : ''}
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteFixture(${fixture.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        await updateAdminStatistics();
        
    } catch (error) {
        console.error('Error rendering admin fixtures:', error);
    }
}

// Render admin results table
export async function renderAdminResults() {
    try {
        const results = await getData(DB_KEYS.RESULTS);
        const players = await getData(DB_KEYS.PLAYERS);
        const tbody = document.querySelector('#admin-results-table tbody');
        
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (results.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">No results recorded</td></tr>';
            return;
        }
        
        results.forEach(result => {
            const homePlayer = players.find(p => p.id === result.home_player_id);
            const awayPlayer = players.find(p => p.id === result.away_player_id);
            const matchDate = new Date(result.date);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${matchDate.toLocaleDateString()}</td>
                <td>${homePlayer?.name || 'Unknown'}</td>
                <td>
                    <span class="fw-bold">${result.home_score} - ${result.away_score}</span>
                </td>
                <td>${awayPlayer?.name || 'Unknown'}</td>
                <td>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteResult(${result.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        await updateAdminStatistics();
        
    } catch (error) {
        console.error('Error rendering admin results:', error);
    }
}

// Player management functions
export async function editPlayer(playerId) {
    const players = await getData(DB_KEYS.PLAYERS);
    const player = players.find(p => p.id === playerId);
    if (!player) return;
    
    const newName = prompt('Enter new name:', player.name);
    const newTeam = prompt('Enter new team:', player.team);
    const newStrength = prompt('Enter new strength:', player.strength);
    
    if (newName === null || newTeam === null) return;
    
    try {
        const updatedPlayer = {
            ...player,
            name: newName,
            team: newTeam,
            strength: parseInt(newStrength) || player.strength
        };
        
        await updatePlayer(updatedPlayer);
        showNotification('Player updated successfully!', 'success');
        await renderAdminPlayers();
        await populatePlayerSelects();
        
    } catch (error) {
        console.error('Error updating player:', error);
        showNotification('Failed to update player', 'error');
    }
}

export async function deletePlayer(playerId) {
    if (!confirm('Are you sure you want to delete this player? This will also delete their fixtures and results.')) {
        return;
    }
    
    try {
        // Delete related results first
        await supabase.from('results').delete().or(`home_player_id.eq.${playerId},away_player_id.eq.${playerId}`);
        
        // Delete related fixtures
        await supabase.from('fixtures').delete().or(`home_player_id.eq.${playerId},away_player_id.eq.${playerId}`);
        
        // Delete player
        const { error } = await supabase.from('players').delete().eq('id', playerId);
        
        if (error) throw error;
        
        showNotification('Player deleted successfully!', 'success');
        await renderAdminPlayers();
        await populatePlayerSelects();
        
    } catch (error) {
        console.error('Error deleting player:', error);
        showNotification('Failed to delete player', 'error');
    }
}

export async function deleteFixture(fixtureId) {
    if (!confirm('Are you sure you want to delete this fixture?')) {
        return;
    }
    
    try {
        const { error } = await supabase.from('fixtures').delete().eq('id', fixtureId);
        
        if (error) throw error;
        
        showNotification('Fixture deleted successfully!', 'success');
        await renderAdminFixtures();
        
    } catch (error) {
        console.error('Error deleting fixture:', error);
        showNotification('Failed to delete fixture', 'error');
    }
}

export async function deleteResult(resultId) {
    if (!confirm('Are you sure you want to delete this result?')) {
        return;
    }
    
    try {
        const { error } = await supabase.from('results').delete().eq('id', resultId);
        
        if (error) throw error;
        
        showNotification('Result deleted successfully!', 'success');
        await renderAdminResults();
        
    } catch (error) {
        console.error('Error deleting result:', error);
        showNotification('Failed to delete result', 'error');
    }
}

export async function addFixtureResult(fixtureId) {
    const fixtures = await getData(DB_KEYS.FIXTURES);
    const fixture = fixtures.find(f => f.id === fixtureId);
    if (!fixture) return;
    
    const homeScore = prompt(`Enter home score:`);
    const awayScore = prompt(`Enter away score:`);
    
    if (homeScore === null || awayScore === null) return;
    
    try {
        // Add result
        const newResult = {
            home_player_id: fixture.home_player_id,
            away_player_id: fixture.away_player_id,
            home_score: parseInt(homeScore),
            away_score: parseInt(awayScore),
            date: fixture.date
        };
        
        await addResult(newResult);
        showNotification('Result added successfully!', 'success');
        await renderAdminFixtures();
        await renderAdminResults();
        
    } catch (error) {
        console.error('Error adding fixture result:', error);
        showNotification('Failed to add result', 'error');
    }
}

// Event Listeners for admin
export function setupAdminEventListeners() {
    try {
        // Admin form submissions
        const addPlayerForm = document.getElementById('add-player-form');
        if (addPlayerForm) {
            addPlayerForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                const name = document.getElementById('playerName').value;
                const team = document.getElementById('playerTeam').value;
                const photo = document.getElementById('playerPhoto').value;
                const strength = parseInt(document.getElementById('playerStrength').value) || 2500;
                
                try {
                    await addPlayer({ name, team, photo, strength });
                    this.reset();
                    showNotification('Player added successfully!', 'success');
                } catch (error) {
                    console.error('Error adding player:', error);
                    showNotification('Error adding player: ' + error.message, 'error');
                }
            });
        }
        
        const addFixtureForm = document.getElementById('add-fixture-form');
        if (addFixtureForm) {
            addFixtureForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                const homePlayerId = parseInt(document.getElementById('homePlayerSelect').value);
                const awayPlayerId = parseInt(document.getElementById('awayPlayerSelect').value);
                const date = document.getElementById('fixtureDate').value;
                const time = document.getElementById('fixtureTime').value;
                const venue = document.getElementById('fixtureVenue').value;
                
                // Check if players are different
                if (homePlayerId === awayPlayerId) {
                    showNotification('Home and away players must be different!', 'error');
                    return;
                }
                
                try {
                    const newFixture = {
                        home_player_id: homePlayerId,
                        away_player_id: awayPlayerId,
                        date: date,
                        time: time,
                        venue: venue,
                        played: false
                    };
                    
                    await addFixture(newFixture);
                    this.reset();
                    showNotification('Fixture added successfully!', 'success');
                } catch (error) {
                    console.error('Error adding fixture:', error);
                    showNotification('Error adding fixture: ' + error.message, 'error');
                }
            });
        }
        
        const addResultForm = document.getElementById('add-result-form');
        if (addResultForm) {
            addResultForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                const homePlayerId = parseInt(document.getElementById('homePlayerResult').value);
                const awayPlayerId = parseInt(document.getElementById('awayPlayerResult').value);
                const homeScore = parseInt(document.getElementById('homeScore').value);
                const awayScore = parseInt(document.getElementById('awayScore').value);
                const date = document.getElementById('matchDateResult').value;
                
                // Check if players are different
                if (homePlayerId === awayPlayerId) {
                    showNotification('Home and away players must be different!', 'error');
                    return;
                }
                
                // Check if players are selected
                if (!homePlayerId || !awayPlayerId) {
                    showNotification('Please select both players!', 'error');
                    return;
                }
                
                try {
                    const newResult = {
                        home_player_id: homePlayerId,
                        away_player_id: awayPlayerId,
                        home_score: homeScore,
                        away_score: awayScore,
                        date: date
                    };
                    
                    await addResult(newResult);
                    this.reset();
                    showNotification('Result added successfully!', 'success');
                } catch (error) {
                    console.error('Error adding result:', error);
                    showNotification('Error adding result: ' + error.message, 'error');
                }
            });
        }
        
        // Export data
        const exportButton = document.getElementById('export-data');
        if (exportButton) {
            exportButton.addEventListener('click', async function() {
                try {
                    await window.exportTournamentData();
                } catch (error) {
                    console.error('Error exporting data:', error);
                    showNotification('Error exporting data: ' + error.message, 'error');
                }
            });
        }
        
    } catch (error) {
        console.error('Error setting up event listeners:', error);
    }
}

// Make functions globally available for onclick events
window.editPlayer = editPlayer;
window.deletePlayer = deletePlayer;
window.deleteFixture = deleteFixture;
window.deleteResult = deleteResult;
window.addFixtureResult = addFixtureResult;

// Initialize admin dashboard
document.addEventListener('DOMContentLoaded', async function() {
    if (window.location.pathname.includes('admin.html')) {
        const isAuthenticated = checkAdminAuth();
        
        if (isAuthenticated) {
            try {
                // Show loading state
                const loginSection = document.getElementById('login-section');
                const adminDashboard = document.getElementById('admin-dashboard');
                
                if (loginSection) loginSection.classList.add('d-none');
                if (adminDashboard) adminDashboard.classList.remove('d-none');
                
                // Initialize database
                await initializeDatabase();
                
                // Setup event listeners
                setupAdminEventListeners();
                
                // Populate data
                await renderAdminPlayers();
                await renderAdminFixtures();
                await renderAdminResults();
                await populatePlayerSelects();
                
                // Set today's date as default for date inputs
                const today = new Date().toISOString().split('T')[0];
                const fixtureDate = document.getElementById('fixtureDate');
                const matchDateResult = document.getElementById('matchDateResult');
                
                if (fixtureDate) fixtureDate.value = today;
                if (matchDateResult) matchDateResult.value = today;
                
                showNotification('Admin dashboard loaded successfully!', 'success');
                
            } catch (error) {
                console.error('Error initializing admin dashboard:', error);
                showNotification('Error loading admin dashboard: ' + error.message, 'error');
            }
        }
    }
});
