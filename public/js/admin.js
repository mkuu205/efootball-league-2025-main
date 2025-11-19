// admin.js - Fixed Admin Functions
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
    console.log('🔐 Admin auth check:', isAuthenticated);
    return isAuthenticated;
}

// Enhanced data loading with fallbacks
async function loadDataWithFallback(key) {
    try {
        console.log(`📥 Loading data for: ${key}`);
        let data = await getData(key);
        
        // If data is null or undefined, try to initialize empty array
        if (data === null || data === undefined) {
            console.warn(`⚠️ No data found for ${key}, initializing empty array`);
            data = [];
            await saveData(key, data);
        }
        
        // Ensure data is an array
        if (!Array.isArray(data)) {
            console.warn(`⚠️ Data for ${key} is not array, converting...`, data);
            data = [data].filter(item => item !== null && item !== undefined);
            await saveData(key, data);
        }
        
        console.log(`✅ Loaded ${data.length} items for ${key}`);
        return data;
    } catch (error) {
        console.error(`❌ Error loading ${key}:`, error);
        // Return empty array as fallback
        return [];
    }
}

// Enhanced populate player selects
export async function populatePlayerSelects() {
    try {
        console.log('🔄 Populating player selects...');
        const players = await loadDataWithFallback(DB_KEYS.PLAYERS);

        const selects = [
            'homePlayerSelect',
            'awayPlayerSelect', 
            'homePlayerResult',
            'awayPlayerResult'
        ];
        
        console.log(`🎯 Found ${selects.length} select elements to populate`);
        
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                console.log(`📝 Populating select: ${selectId}`);
                select.innerHTML = '<option value="" selected disabled>Select player</option>';
                
                if (players.length === 0) {
                    const option = document.createElement('option');
                    option.value = "";
                    option.textContent = "No players available";
                    option.disabled = true;
                    select.appendChild(option);
                    return;
                }
                
                players.forEach(player => {
                    if (player && player.id && player.name) {
                        const option = document.createElement('option');
                        option.value = player.id;
                        option.textContent = `${player.name} (${player.team || 'No Team'})`;
                        select.appendChild(option);
                    }
                });
                
                console.log(`✅ Populated ${selectId} with ${select.children.length - 1} players`);
            } else {
                console.warn(`⚠️ Select element not found: ${selectId}`);
            }
        });
    } catch (error) {
        console.error('❌ Error populating player selects:', error);
        showNotification('Error loading player data', 'error');
    }
}

// Update admin statistics
export async function updateAdminStatistics() {
    try {
        const players = await loadDataWithFallback(DB_KEYS.PLAYERS);
        const fixtures = await loadDataWithFallback(DB_KEYS.FIXTURES);
        const results = await loadDataWithFallback(DB_KEYS.RESULTS);
        
        console.log('📊 Updating admin statistics:', {
            players: players.length,
            fixtures: fixtures.length,
            results: results.length
        });
        
        // Update counts
        const updateElement = (id, value) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        };
        
        updateElement('players-count', players.length);
        updateElement('fixtures-count', fixtures.length);
        updateElement('results-count', results.length);
        updateElement('live-players', players.length);
        updateElement('players-badge', players.length);
        updateElement('fixtures-badge', fixtures.length);
        updateElement('results-badge', results.length);
        
    } catch (error) {
        console.error('❌ Error updating admin statistics:', error);
    }
}

// Enhanced render admin players table
export async function renderAdminPlayers() {
    try {
        const players = await loadDataWithFallback(DB_KEYS.PLAYERS);
        const tbody = document.querySelector('#players-table tbody');
        
        if (!tbody) {
            console.warn('⚠️ Players table tbody not found');
            return;
        }
        
        tbody.innerHTML = '';
        
        if (players.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">No players found. Add some players to get started.</td></tr>';
            console.log('ℹ️ No players to display');
            return;
        }
        
        console.log(`👥 Rendering ${players.length} players`);
        
        players.forEach(player => {
            if (!player || !player.id) {
                console.warn('⚠️ Skipping invalid player:', player);
                return;
            }
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div class="d-flex align-items-center">
                        <img src="${player.photo || 'https://via.placeholder.com/40/6a11cb/ffffff?text=?'}" 
                             alt="${player.name}" class="rounded-circle me-2" width="40" height="40"
                             onerror="this.src='https://via.placeholder.com/40/6a11cb/ffffff?text=?'">
                        <div>
                            <div class="fw-bold">${player.name || 'Unknown'}</div>
                            <small class="text-muted">ID: ${player.id}</small>
                        </div>
                    </div>
                </td>
                <td>${player.team || 'No Team'}</td>
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
        console.log('✅ Players table rendered successfully');
        
    } catch (error) {
        console.error('❌ Error rendering admin players:', error);
        showNotification('Error loading players table', 'error');
    }
}

// Enhanced render admin fixtures table
export async function renderAdminFixtures() {
    try {
        const fixtures = await loadDataWithFallback(DB_KEYS.FIXTURES);
        const players = await loadDataWithFallback(DB_KEYS.PLAYERS);
        const tbody = document.querySelector('#admin-fixtures-table tbody');
        
        if (!tbody) {
            console.warn('⚠️ Fixtures table tbody not found');
            return;
        }
        
        tbody.innerHTML = '';
        
        if (fixtures.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">No fixtures scheduled. Add some fixtures to get started.</td></tr>';
            console.log('ℹ️ No fixtures to display');
            return;
        }
        
        console.log(`📅 Rendering ${fixtures.length} fixtures`);
        
        fixtures.forEach(fixture => {
            if (!fixture || !fixture.id) {
                console.warn('⚠️ Skipping invalid fixture:', fixture);
                return;
            }
            
            const homePlayer = players.find(p => p && p.id === fixture.home_player_id);
            const awayPlayer = players.find(p => p && p.id === fixture.away_player_id);
            const matchDate = fixture.date ? new Date(fixture.date) : new Date();
            const isCompleted = fixture.played || false;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${matchDate.toLocaleDateString()}</td>
                <td>${fixture.time || 'TBD'}</td>
                <td>${homePlayer?.name || 'Player Not Found'}</td>
                <td>${awayPlayer?.name || 'Player Not Found'}</td>
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
        console.log('✅ Fixtures table rendered successfully');
        
    } catch (error) {
        console.error('❌ Error rendering admin fixtures:', error);
        showNotification('Error loading fixtures table', 'error');
    }
}

// Enhanced render admin results table
export async function renderAdminResults() {
    try {
        const results = await loadDataWithFallback(DB_KEYS.RESULTS);
        const players = await loadDataWithFallback(DB_KEYS.PLAYERS);
        const tbody = document.querySelector('#admin-results-table tbody');
        
        if (!tbody) {
            console.warn('⚠️ Results table tbody not found');
            return;
        }
        
        tbody.innerHTML = '';
        
        if (results.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">No results recorded. Add some results to get started.</td></tr>';
            console.log('ℹ️ No results to display');
            return;
        }
        
        console.log(`⚽ Rendering ${results.length} results`);
        
        results.forEach(result => {
            if (!result || !result.id) {
                console.warn('⚠️ Skipping invalid result:', result);
                return;
            }
            
            const homePlayer = players.find(p => p && p.id === result.home_player_id);
            const awayPlayer = players.find(p => p && p.id === result.away_player_id);
            const matchDate = result.date ? new Date(result.date) : new Date();
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${matchDate.toLocaleDateString()}</td>
                <td>${homePlayer?.name || 'Player Not Found'}</td>
                <td>
                    <span class="fw-bold">${result.home_score || 0} - ${result.away_score || 0}</span>
                </td>
                <td>${awayPlayer?.name || 'Player Not Found'}</td>
                <td>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteResult(${result.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        await updateAdminStatistics();
        console.log('✅ Results table rendered successfully');
        
    } catch (error) {
        console.error('❌ Error rendering admin results:', error);
        showNotification('Error loading results table', 'error');
    }
}

// Enhanced player management functions
export async function editPlayer(playerId) {
    try {
        const players = await loadDataWithFallback(DB_KEYS.PLAYERS);
        const player = players.find(p => p && p.id === playerId);
        
        if (!player) {
            showNotification('Player not found!', 'error');
            return;
        }
        
        const newName = prompt('Enter new name:', player.name);
        if (newName === null) return;
        
        const newTeam = prompt('Enter new team:', player.team);
        if (newTeam === null) return;
        
        const newStrength = prompt('Enter new strength:', player.strength);
        if (newStrength === null) return;
        
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
        console.error('❌ Error updating player:', error);
        showNotification('Failed to update player', 'error');
    }
}

export async function deletePlayer(playerId) {
    if (!confirm('Are you sure you want to delete this player? This will also delete their fixtures and results.')) {
        return;
    }
    
    try {
        // Get current data
        const fixtures = await loadDataWithFallback(DB_KEYS.FIXTURES);
        const results = await loadDataWithFallback(DB_KEYS.RESULTS);
        const players = await loadDataWithFallback(DB_KEYS.PLAYERS);
        
        // Filter out player's fixtures and results
        const updatedFixtures = fixtures.filter(f => 
            f && f.home_player_id !== playerId && f.away_player_id !== playerId
        );
        const updatedResults = results.filter(r => 
            r && r.home_player_id !== playerId && r.away_player_id !== playerId
        );
        const updatedPlayers = players.filter(p => p && p.id !== playerId);
        
        // Save updated data
        await saveData(DB_KEYS.FIXTURES, updatedFixtures);
        await saveData(DB_KEYS.RESULTS, updatedResults);
        await saveData(DB_KEYS.PLAYERS, updatedPlayers);
        
        showNotification('Player deleted successfully!', 'success');
        await renderAdminPlayers();
        await renderAdminFixtures();
        await renderAdminResults();
        await populatePlayerSelects();
        
    } catch (error) {
        console.error('❌ Error deleting player:', error);
        showNotification('Failed to delete player', 'error');
    }
}

export async function deleteFixture(fixtureId) {
    if (!confirm('Are you sure you want to delete this fixture?')) {
        return;
    }
    
    try {
        const fixtures = await loadDataWithFallback(DB_KEYS.FIXTURES);
        const updatedFixtures = fixtures.filter(f => f && f.id !== fixtureId);
        await saveData(DB_KEYS.FIXTURES, updatedFixtures);
        
        showNotification('Fixture deleted successfully!', 'success');
        await renderAdminFixtures();
        
    } catch (error) {
        console.error('❌ Error deleting fixture:', error);
        showNotification('Failed to delete fixture', 'error');
    }
}

export async function deleteResult(resultId) {
    if (!confirm('Are you sure you want to delete this result?')) {
        return;
    }
    
    try {
        const results = await loadDataWithFallback(DB_KEYS.RESULTS);
        const updatedResults = results.filter(r => r && r.id !== resultId);
        await saveData(DB_KEYS.RESULTS, updatedResults);
        
        showNotification('Result deleted successfully!', 'success');
        await renderAdminResults();
        
    } catch (error) {
        console.error('❌ Error deleting result:', error);
        showNotification('Failed to delete result', 'error');
    }
}

export async function addFixtureResult(fixtureId) {
    try {
        const fixtures = await loadDataWithFallback(DB_KEYS.FIXTURES);
        const fixture = fixtures.find(f => f && f.id === fixtureId);
        
        if (!fixture) {
            showNotification('Fixture not found!', 'error');
            return;
        }
        
        const homeScore = prompt(`Enter home score for ${fixture.home_player_id}:`);
        if (homeScore === null) return;
        
        const awayScore = prompt(`Enter away score for ${fixture.away_player_id}:`);
        if (awayScore === null) return;
        
        // Add result
        const results = await loadDataWithFallback(DB_KEYS.RESULTS);
        const newResult = {
            id: Date.now(), // Simple ID generation
            home_player_id: fixture.home_player_id,
            away_player_id: fixture.away_player_id,
            home_score: parseInt(homeScore) || 0,
            away_score: parseInt(awayScore) || 0,
            date: fixture.date || new Date().toISOString().split('T')[0]
        };
        
        results.push(newResult);
        await saveData(DB_KEYS.RESULTS, results);
        
        // Update fixture as played
        const updatedFixtures = fixtures.map(f => 
            f.id === fixtureId ? { ...f, played: true } : f
        );
        await saveData(DB_KEYS.FIXTURES, updatedFixtures);
        
        showNotification('Result added successfully!', 'success');
        await renderAdminFixtures();
        await renderAdminResults();
        
    } catch (error) {
        console.error('❌ Error adding fixture result:', error);
        showNotification('Failed to add result', 'error');
    }
}

// Enhanced Event Listeners for admin
export function setupAdminEventListeners() {
    try {
        console.log('🔧 Setting up admin event listeners...');
        
        // Admin form submissions
        const addPlayerForm = document.getElementById('add-player-form');
        if (addPlayerForm) {
            addPlayerForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                console.log('👤 Adding new player...');
                
                const name = document.getElementById('playerName')?.value;
                const team = document.getElementById('playerTeam')?.value;
                const photo = document.getElementById('playerPhoto')?.value;
                const strength = parseInt(document.getElementById('playerStrength')?.value) || 2500;
                
                if (!name || !team) {
                    showNotification('Please fill in all required fields!', 'error');
                    return;
                }
                
                try {
                    await addPlayer({ 
                        name, 
                        team, 
                        photo: photo || `https://via.placeholder.com/150/6a11cb/ffffff?text=${name.charAt(0)}`, 
                        strength 
                    });
                    this.reset();
                    showNotification('Player added successfully!', 'success');
                    await renderAdminPlayers();
                    await populatePlayerSelects();
                } catch (error) {
                    console.error('❌ Error adding player:', error);
                    showNotification('Error adding player: ' + error.message, 'error');
                }
            });
        }
        
        const addFixtureForm = document.getElementById('add-fixture-form');
        if (addFixtureForm) {
            addFixtureForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                console.log('📅 Adding new fixture...');
                
                const homePlayerId = parseInt(document.getElementById('homePlayerSelect')?.value);
                const awayPlayerId = parseInt(document.getElementById('awayPlayerSelect')?.value);
                const date = document.getElementById('fixtureDate')?.value;
                const time = document.getElementById('fixtureTime')?.value;
                const venue = document.getElementById('fixtureVenue')?.value;
                
                // Validation
                if (!homePlayerId || !awayPlayerId) {
                    showNotification('Please select both players!', 'error');
                    return;
                }
                
                if (homePlayerId === awayPlayerId) {
                    showNotification('Home and away players must be different!', 'error');
                    return;
                }
                
                if (!date) {
                    showNotification('Please select a date!', 'error');
                    return;
                }
                
                try {
                    const fixtures = await loadDataWithFallback(DB_KEYS.FIXTURES);
                    const newFixture = {
                        id: Date.now(),
                        home_player_id: homePlayerId,
                        away_player_id: awayPlayerId,
                        date: date,
                        time: time || '15:00',
                        venue: venue || 'Virtual Stadium',
                        played: false
                    };
                    
                    fixtures.push(newFixture);
                    await saveData(DB_KEYS.FIXTURES, fixtures);
                    
                    this.reset();
                    showNotification('Fixture added successfully!', 'success');
                    await renderAdminFixtures();
                } catch (error) {
                    console.error('❌ Error adding fixture:', error);
                    showNotification('Error adding fixture: ' + error.message, 'error');
                }
            });
        }
        
        const addResultForm = document.getElementById('add-result-form');
        if (addResultForm) {
            addResultForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                console.log('⚽ Adding new result...');
                
                const homePlayerId = parseInt(document.getElementById('homePlayerResult')?.value);
                const awayPlayerId = parseInt(document.getElementById('awayPlayerResult')?.value);
                const homeScore = parseInt(document.getElementById('homeScore')?.value) || 0;
                const awayScore = parseInt(document.getElementById('awayScore')?.value) || 0;
                const date = document.getElementById('matchDateResult')?.value;
                
                // Validation
                if (!homePlayerId || !awayPlayerId) {
                    showNotification('Please select both players!', 'error');
                    return;
                }
                
                if (homePlayerId === awayPlayerId) {
                    showNotification('Home and away players must be different!', 'error');
                    return;
                }
                
                if (!date) {
                    showNotification('Please select a date!', 'error');
                    return;
                }
                
                try {
                    const results = await loadDataWithFallback(DB_KEYS.RESULTS);
                    const newResult = {
                        id: Date.now(),
                        home_player_id: homePlayerId,
                        away_player_id: awayPlayerId,
                        home_score: homeScore,
                        away_score: awayScore,
                        date: date
                    };
                    
                    results.push(newResult);
                    await saveData(DB_KEYS.RESULTS, results);
                    
                    this.reset();
                    showNotification('Result added successfully!', 'success');
                    await renderAdminResults();
                } catch (error) {
                    console.error('❌ Error adding result:', error);
                    showNotification('Error adding result: ' + error.message, 'error');
                }
            });
        }
        
        // Export data
        const exportButton = document.getElementById('export-data');
        if (exportButton) {
            exportButton.addEventListener('click', async function() {
                try {
                    if (window.exportTournamentData) {
                        await window.exportTournamentData();
                    } else {
                        showNotification('Export function not available', 'error');
                    }
                } catch (error) {
                    console.error('❌ Error exporting data:', error);
                    showNotification('Error exporting data: ' + error.message, 'error');
                }
            });
        }
        
        console.log('✅ Admin event listeners setup complete');
        
    } catch (error) {
        console.error('❌ Error setting up event listeners:', error);
    }
}

// Make functions globally available for onclick events
window.editPlayer = editPlayer;
window.deletePlayer = deletePlayer;
window.deleteFixture = deleteFixture;
window.deleteResult = deleteResult;
window.addFixtureResult = addFixtureResult;

// Enhanced admin dashboard initialization
async function initializeAdminDashboard() {
    console.log('🚀 Initializing Admin Dashboard...');
    
    try {
        // Show loading state
        const loginSection = document.getElementById('login-section');
        const adminDashboard = document.getElementById('admin-dashboard');
        const loadingSection = document.getElementById('admin-loading');
        
        if (loadingSection) loadingSection.classList.remove('d-none');
        if (loginSection) loginSection.classList.add('d-none');
        if (adminDashboard) adminDashboard.classList.add('d-none');
        
        // Initialize database with retry
        let dbInitialized = false;
        let retries = 3;
        
        while (retries > 0 && !dbInitialized) {
            try {
                await initializeDatabase();
                dbInitialized = true;
                console.log('✅ Database initialized successfully');
            } catch (error) {
                retries--;
                console.warn(`⚠️ Database init failed, ${retries} retries left:`, error);
                if (retries === 0) throw error;
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        // Setup event listeners
        setupAdminEventListeners();
        
        // Load and populate data
        await Promise.all([
            renderAdminPlayers(),
            renderAdminFixtures(),
            renderAdminResults(),
            populatePlayerSelects()
        ]);
        
        // Set today's date as default for date inputs
        const today = new Date().toISOString().split('T')[0];
        const fixtureDate = document.getElementById('fixtureDate');
        const matchDateResult = document.getElementById('matchDateResult');
        
        if (fixtureDate) fixtureDate.value = today;
        if (matchDateResult) matchDateResult.value = today;
        
        // Show admin dashboard
        if (loadingSection) loadingSection.classList.add('d-none');
        if (adminDashboard) adminDashboard.classList.remove('d-none');
        
        showNotification('Admin dashboard loaded successfully!', 'success');
        console.log('🎉 Admin dashboard initialization complete');
        
    } catch (error) {
        console.error('❌ Failed to initialize admin dashboard:', error);
        
        // Show error state
        const loadingSection = document.getElementById('admin-loading');
        const loginSection = document.getElementById('login-section');
        
        if (loadingSection) loadingSection.classList.add('d-none');
        if (loginSection) loginSection.classList.remove('d-none');
        
        showNotification('Failed to load admin dashboard. Please refresh the page.', 'error');
    }
}

// Initialize admin dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', async function() {
    if (window.location.pathname.includes('admin.html')) {
        console.log('🔍 Admin page detected, checking authentication...');
        const isAuthenticated = checkAdminAuth();
        
        if (isAuthenticated) {
            await initializeAdminDashboard();
        } else {
            console.log('🔒 User not authenticated, showing login form');
            // Login form will handle authentication
        }
    }
});
