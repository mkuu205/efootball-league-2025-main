// admin.js - Fixed Admin Functions with All Features
import { 
    getData, 
    saveData, 
    DB_KEYS, 
    showNotification,
    getSupabase,
    initializeDatabase,
    addPlayer,
    addFixture,
    addResult,
    updatePlayer,
    deletePlayer as deletePlayerDB,
    deleteFixture as deleteFixtureDB,
    deleteResult as deleteResultDB,
    updateFixture,
    refreshAllDisplays,
    resetTournament,
    resetAllResults,
    exportTournamentData,
    getFixtureById  // ADDED: Import for edit functionality
} from './database.js';

// Get the supabase client instance
const supabase = getSupabase();

// Simple authentication check
export function checkAdminAuth() {
    const isAuthenticated = sessionStorage.getItem('admin_session') === 'true';
    console.log('🔐 Admin auth check:', isAuthenticated);
    return isAuthenticated;
}

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

// Enhanced data loading with fallbacks
async function loadDataWithFallback(key) {
    try {
        console.log(`📥 Loading data for: ${key}`);
        let data = await getData(key);
        
        // If data is null or undefined, try to initialize empty array
        if (data === null || data === undefined) {
            console.warn(`⚠️ No data found for ${key}, initializing empty array`);
            data = [];
        }
        
        // Ensure data is an array
        if (!Array.isArray(data)) {
            console.warn(`⚠️ Data for ${key} is not array, converting...`, data);
            data = [data].filter(item => item !== null && item !== undefined);
        }
        
        console.log(`✅ Loaded ${data.length} items for ${key}`);
        return data;
    } catch (error) {
        console.error(`❌ Error loading ${key}:`, error);
        // Return empty array as fallback
        return [];
    }
}

// Enhanced populate player selects - FIXED
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
        console.log(`👥 Available players: ${players.length}`);
        
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                console.log(`📝 Populating select: ${selectId}`);
                // Clear existing options
                select.innerHTML = '<option value="" selected disabled>Select player</option>';
                
                if (players.length === 0) {
                    const option = document.createElement('option');
                    option.value = "";
                    option.textContent = "No players available";
                    option.disabled = true;
                    select.appendChild(option);
                    console.warn(`⚠️ No players available for ${selectId}`);
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

// Update system information
async function updateSystemInformation() {
    try {
        const players = await loadDataWithFallback(DB_KEYS.PLAYERS);
        const fixtures = await loadDataWithFallback(DB_KEYS.FIXTURES);
        const results = await loadDataWithFallback(DB_KEYS.RESULTS);
        
        // Update system info panel
        const updateElement = (id, value) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        };
        
        updateElement('info-players', players.length);
        updateElement('info-fixtures', fixtures.length);
        updateElement('info-results', results.length);
        updateElement('db-status', 'Online');
        
        // Update last sync time
        const lastSync = localStorage.getItem('efl_last_sync');
        const lastSyncElement = document.getElementById('last-sync');
        if (lastSyncElement) {
            lastSyncElement.textContent = lastSync ? new Date(lastSync).toLocaleString() : 'Never';
        }
        
    } catch (error) {
        console.error('Error updating system information:', error);
        const statusElement = document.getElementById('db-status');
        if (statusElement) {
            statusElement.textContent = 'Offline';
            statusElement.className = 'badge bg-danger';
        }
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
        
        for (const player of players) {
            if (!player || !player.id) {
                console.warn('⚠️ Skipping invalid player:', player);
                continue;
            }
            
            // Use player's photo if available, otherwise generate avatar
            const avatarUrl = getPlayerAvatar(player, 40);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div class="d-flex align-items-center">
                        <img src="${avatarUrl}" 
                             alt="${player.name}" 
                             class="rounded-circle me-2" 
                             width="40" 
                             height="40"
                             style="object-fit: cover;"
                             onerror="this.src='https://ui-avatars.com/api/?name=${player.name?.charAt(0)?.toUpperCase() || 'P'}&background=6a11cb&color=fff&size=40'">
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
        }
        
        await updateAdminStatistics();
        await updateSystemInformation();
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
        
        for (const fixture of fixtures) {
            if (!fixture || !fixture.id) {
                console.warn('⚠️ Skipping invalid fixture:', fixture);
                continue;
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
                    <!-- ADDED: Edit button -->
                    <button class="btn btn-sm btn-outline-warning me-1" onclick="editFixture(${fixture.id})">
                        <i class="fas fa-edit"></i>
                    </button>
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
        }
        
        await updateAdminStatistics();
        await updateSystemInformation();
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
        
        for (const result of results) {
            if (!result || !result.id) {
                console.warn('⚠️ Skipping invalid result:', result);
                continue;
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
        }
        
        await updateAdminStatistics();
        await updateSystemInformation();
        console.log('✅ Results table rendered successfully');
        
    } catch (error) {
        console.error('❌ Error rendering admin results:', error);
        showNotification('Error loading results table', 'error');
    }
}

// ADDED: Function to edit a fixture
export async function editFixture(fixtureId) {
    try {
        const fixture = await getFixtureById(fixtureId);
        if (!fixture) {
            showNotification('Fixture not found!', 'error');
            return;
        }
        
        const players = await loadDataWithFallback(DB_KEYS.PLAYERS);
        
        // Create modal for editing fixture
        const modalHTML = `
            <div class="modal fade" id="editFixtureModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content bg-dark text-light">
                        <div class="modal-header bg-primary">
                            <h5 class="modal-title">Edit Fixture</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="edit-fixture-form">
                                <div class="mb-3">
                                    <label for="edit-home-player" class="form-label">Home Player</label>
                                    <select class="form-select bg-dark text-light" id="edit-home-player" required>
                                        <option value="">Select home player...</option>
                                        ${players.map(player => 
                                            `<option value="${player.id}" ${player.id === fixture.home_player_id ? 'selected' : ''}>
                                                ${player.name} (${player.team || 'No Team'})
                                            </option>`
                                        ).join('')}
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label for="edit-away-player" class="form-label">Away Player</label>
                                    <select class="form-select bg-dark text-light" id="edit-away-player" required>
                                        <option value="">Select away player...</option>
                                        ${players.map(player => 
                                            `<option value="${player.id}" ${player.id === fixture.away_player_id ? 'selected' : ''}>
                                                ${player.name} (${player.team || 'No Team'})
                                            </option>`
                                        ).join('')}
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label for="edit-fixture-date" class="form-label">Match Date</label>
                                    <input type="date" class="form-control bg-dark text-light" 
                                           id="edit-fixture-date" value="${fixture.date}" required>
                                </div>
                                <div class="mb-3">
                                    <label for="edit-fixture-time" class="form-label">Match Time</label>
                                    <input type="time" class="form-control bg-dark text-light" 
                                           id="edit-fixture-time" value="${fixture.time || '15:00'}">
                                </div>
                                <div class="mb-3">
                                    <label for="edit-fixture-venue" class="form-label">Venue</label>
                                    <input type="text" class="form-control bg-dark text-light" 
                                           id="edit-fixture-venue" value="${fixture.venue || 'Virtual Stadium'}" 
                                           placeholder="Enter venue name">
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" id="save-fixture-changes">
                                <i class="fas fa-save me-2"></i>Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if any
        const existingModal = document.getElementById('editFixtureModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Add modal to DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('editFixtureModal'));
        modal.show();
        
        // Add event listener for save button
        document.getElementById('save-fixture-changes').addEventListener('click', async () => {
            await saveFixtureChanges(fixtureId);
        });
        
    } catch (error) {
        console.error('❌ Error editing fixture:', error);
        showNotification('Error loading fixture data', 'error');
    }
}

// ADDED: Function to save fixture changes
async function saveFixtureChanges(fixtureId) {
    try {
        const homePlayerId = parseInt(document.getElementById('edit-home-player').value);
        const awayPlayerId = parseInt(document.getElementById('edit-away-player').value);
        const date = document.getElementById('edit-fixture-date').value;
        const time = document.getElementById('edit-fixture-time').value;
        const venue = document.getElementById('edit-fixture-venue').value;
        
        // Validation
        if (!homePlayerId || !awayPlayerId || !date) {
            showNotification('Please fill in all required fields!', 'error');
            return;
        }
        
        if (homePlayerId === awayPlayerId) {
            showNotification('Home and away players must be different!', 'error');
            return;
        }
        
        const fixture = await getFixtureById(fixtureId);
        if (!fixture) {
            showNotification('Fixture not found!', 'error');
            return;
        }
        
        // Update fixture data
        const updatedFixture = {
            ...fixture,
            home_player_id: homePlayerId,
            away_player_id: awayPlayerId,
            date: date,
            time: time,
            venue: venue,
            updated_at: new Date().toISOString()
        };
        
        // Save to database
        await updateFixture(updatedFixture);
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editFixtureModal'));
        modal.hide();
        
        // Refresh fixtures display
        await renderAdminFixtures();
        
        showNotification('Fixture updated successfully!', 'success');
        
    } catch (error) {
        console.error('❌ Error saving fixture changes:', error);
        showNotification('Error updating fixture: ' + error.message, 'error');
    }
}

// Enhanced player management functions - FIXED
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
        
        // Create update data WITHOUT the id field in the main object
        const updatedPlayer = {
            id: playerId,
            name: newName,
            team: newTeam,
            strength: parseInt(newStrength) || player.strength,
            updated_at: new Date().toISOString()
        };
        
        // Use database function to update - pass playerId separately
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
        await deletePlayerDB(playerId);
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
        await deleteFixtureDB(fixtureId);
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
        await deleteResultDB(resultId);
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
        
        const homeScore = prompt(`Enter home score for fixture ${fixtureId}:`);
        if (homeScore === null) return;
        
        const awayScore = prompt(`Enter away score for fixture ${fixtureId}:`);
        if (awayScore === null) return;
        
        // Add result using database function
        await addResult({
            home_player_id: fixture.home_player_id,
            away_player_id: fixture.away_player_id,
            home_score: parseInt(homeScore) || 0,
            away_score: parseInt(awayScore) || 0,
            date: fixture.date || new Date().toISOString().split('T')[0]
        });
        
        showNotification('Result added successfully!', 'success');
        await renderAdminFixtures();
        await renderAdminResults();
        
    } catch (error) {
        console.error('❌ Error adding fixture result:', error);
        showNotification('Failed to add result', 'error');
    }
}

// Enhanced Event Listeners for admin - FIXED
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
                const email = document.getElementById('playerEmail')?.value;
                const phone = document.getElementById('playerPhone')?.value;
                const team = document.getElementById('playerTeam')?.value;
                const photo = document.getElementById('playerPhoto')?.value;
                const strength = parseInt(document.getElementById('playerStrength')?.value) || 2500;
                
                if (!name || !team) {
                    showNotification('Please fill in all required fields!', 'error');
                    return;
                }

                // Validate phone format if provided
                if (phone && !/^254\d{9}$/.test(phone)) {
                    showNotification('Phone must be in format 254XXXXXXXXX', 'error');
                    return;
                }

                // Validate email format if provided
                if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                    showNotification('Please enter a valid email address', 'error');
                    return;
                }
                
                try {
                    // Use provided photo URL if valid, otherwise generate avatar
                    let playerPhoto = photo;
                    if (!playerPhoto || !playerPhoto.startsWith('http')) {
                        playerPhoto = `https://ui-avatars.com/api/?name=${name.charAt(0)}&background=6a11cb&color=fff&size=150`;
                    }
                    
                    await addPlayer({ 
                        name, 
                        email: email || null,
                        phone: phone || null,
                        team, 
                        photo: playerPhoto, 
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
                    await addFixture({
                        home_player_id: homePlayerId,
                        away_player_id: awayPlayerId,
                        date: date,
                        time: time || '15:00',
                        venue: venue || 'Virtual Stadium',
                        played: false,
                        status: 'scheduled'
                    });
                    
                    this.reset();
                    // Set default date
                    const today = new Date().toISOString().split('T')[0];
                    document.getElementById('fixtureDate').value = today;
                    
                    showNotification('Fixture added successfully!', 'success');
                    await renderAdminFixtures();
                    await populatePlayerSelects();
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
                    await addResult({
                        home_player_id: homePlayerId,
                        away_player_id: awayPlayerId,
                        home_score: homeScore,
                        away_score: awayScore,
                        date: date
                    });
                    
                    this.reset();
                    // Set default date
                    const today = new Date().toISOString().split('T')[0];
                    document.getElementById('matchDateResult').value = today;
                    document.getElementById('homeScore').value = 0;
                    document.getElementById('awayScore').value = 0;
                    
                    showNotification('Result added successfully!', 'success');
                    await renderAdminResults();
                    await renderAdminFixtures();
                } catch (error) {
                    console.error('❌ Error adding result:', error);
                    showNotification('Error adding result: ' + error.message, 'error');
                }
            });
        }
        
        console.log('✅ Admin event listeners setup complete');
        
    } catch (error) {
        console.error('❌ Error setting up event listeners:', error);
    }
}

// Enhanced admin dashboard initialization - FIXED
async function initializeAdminDashboard() {
    console.log('🚀 Initializing Admin Dashboard...');
    
    try {
        // Show loading state
        const loginSection = document.getElementById('login-section');
        const adminDashboard = document.getElementById('admin-dashboard');
        
        if (loginSection) loginSection.classList.add('d-none');
        if (adminDashboard) adminDashboard.classList.remove('d-none');
        
        // Initialize database
        await initializeDatabase();
        console.log('✅ Database initialized successfully');
        
        // Setup event listeners FIRST
        setupAdminEventListeners();
        
        // Load and populate data
        await populatePlayerSelects(); // Populate dropdowns FIRST
        await Promise.all([
            renderAdminPlayers(),
            renderAdminFixtures(),
            renderAdminResults()
        ]);
        
        // Update system information
        await updateSystemInformation();
        
        // Set today's date as default for date inputs
        const today = new Date().toISOString().split('T')[0];
        const fixtureDate = document.getElementById('fixtureDate');
        const matchDateResult = document.getElementById('matchDateResult');
        
        if (fixtureDate) fixtureDate.value = today;
        if (matchDateResult) matchDateResult.value = today;
        
        showNotification('Admin dashboard loaded successfully!', 'success');
        console.log('🎉 Admin dashboard initialization complete');
        
    } catch (error) {
        console.error('❌ Failed to initialize admin dashboard:', error);
        showNotification('Failed to load admin dashboard. Please refresh the page.', 'error');
    }
}

// Make functions globally available for onclick events
window.editPlayer = editPlayer;
window.deletePlayer = deletePlayer;
window.deleteFixture = deleteFixture;
window.deleteResult = deleteResult;
window.addFixtureResult = addFixtureResult;
window.editFixture = editFixture; // ADDED: Edit fixture function

// Make reset and export functions available globally
window.resetTournament = resetTournament;
window.resetAllResults = resetAllResults;
window.exportTournamentData = exportTournamentData;

// Initialize admin dashboard when authenticated
document.addEventListener('DOMContentLoaded', async function() {
    if (window.location.pathname.includes('admin.html')) {
        console.log('🔍 Admin page detected, checking authentication...');
        const isAuthenticated = checkAdminAuth();
        
        if (isAuthenticated) {
            console.log('🔓 User authenticated, initializing dashboard...');
            await initializeAdminDashboard();
        } else {
            console.log('🔒 User not authenticated, showing login form');
            // Login form will handle authentication via auth.js
        }
    }
});