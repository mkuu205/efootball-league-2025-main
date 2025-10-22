// Admin-specific functionality with enhanced player management
function populatePlayerSelects() {
    const players = getData(DB_KEYS.PLAYERS);
    console.log('Available players for selects:', players);

    const selects = [
        'homePlayerSelect',
        'awayPlayerSelect',
        'homePlayerResult',
        'awayPlayerResult'
    ];
    
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            // Clear existing options
            select.innerHTML = '<option value="" selected disabled>Select player</option>';
            
            // Add player options
            players.forEach(player => {
                const option = document.createElement('option');
                option.value = player.id;
                option.textContent = `${player.name} (${player.team} - ${player.strength})`;
                select.appendChild(option);
            });
            
            console.log(`Populated ${selectId} with ${players.length} players`);
        } else {
            console.error(`Select element with id '${selectId}' not found`);
        }
    });
}

function updateAdminStatistics() {
    const players = getData(DB_KEYS.PLAYERS);
    const fixtures = getData(DB_KEYS.FIXTURES);
    const results = getData(DB_KEYS.RESULTS);
    
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
}

function renderAdminPlayers() {
    const players = getData(DB_KEYS.PLAYERS);
    
    const container = document.getElementById('players-table');
    if (!container) {
        console.error('Players table container not found');
        return;
    }
    
    const tbody = container.querySelector('tbody');
    if (!tbody) {
        console.error('Players table tbody not found');
        return;
    }
    
    // Remove duplicate players
    const uniquePlayers = [];
    const seenPlayerIds = new Set();
    
    players.forEach(player => {
        if (!seenPlayerIds.has(player.id)) {
            seenPlayerIds.add(player.id);
            uniquePlayers.push(player);
        }
    });
    
    tbody.innerHTML = uniquePlayers.map(player => {
        const stats = calculatePlayerStats(player.id);
        
        return `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <img src="${player.photo}" alt="${player.name}" 
                             class="rounded-circle me-3" style="width: 40px; height: 40px; object-fit: cover;"
                             onerror="this.src='${player.defaultPhoto || 'https://via.placeholder.com/100/1a1a2e/ffffff?text=?'}'">
                        <div>
                            <div class="fw-bold">${player.name}</div>
                            <small class="text-muted">Strength: ${player.strength}</small>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="badge" style="background-color: ${player.teamColor || '#6c757d'}; color: white;">
                        ${player.team}
                    </span>
                </td>
                <td>${player.strength}</td>
                <td>${stats.played}</td>
                <td class="fw-bold text-warning">${stats.points}</td>
                <td>
                    <button class="btn btn-sm btn-outline-info me-1" onclick="editPlayer(${player.id})" title="Edit Player">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-warning me-1" onclick="editPlayerStrength(${player.id})" title="Edit Strength">
                        <i class="fas fa-chart-line"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deletePlayerHandler(${player.id})" title="Delete Player">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    updateAdminStatistics();
}

function renderAdminFixtures() {
    const fixtures = getData(DB_KEYS.FIXTURES);
    const players = getData(DB_KEYS.PLAYERS);
    
    const container = document.getElementById('admin-fixtures-table');
    if (!container) {
        console.error('Fixtures table container not found');
        return;
    }
    
    const tbody = container.querySelector('tbody');
    if (!tbody) {
        console.error('Fixtures table tbody not found');
        return;
    }
    
    tbody.innerHTML = fixtures.map(fixture => {
        const homePlayer = players.find(p => p.id === fixture.homePlayerId);
        const awayPlayer = players.find(p => p.id === fixture.awayPlayerId);
        
        if (!homePlayer || !awayPlayer) {
            console.warn('Missing player data for fixture:', fixture);
            return '';
        }
        
        const statusBadge = fixture.played ? 
            '<span class="badge bg-success status-badge"><i class="fas fa-check me-1"></i>Played</span>' : 
            '<span class="badge bg-warning status-badge"><i class="fas fa-clock me-1"></i>Upcoming</span>';
        
        const legBadge = fixture.isHomeLeg ? 
            '<span class="badge bg-primary me-1">Home</span>' : 
            '<span class="badge bg-secondary me-1">Away</span>';
        
        return `
            <tr>
                <td>${formatDisplayDate(fixture.date)}</td>
                <td>${fixture.time}</td>
                <td>
                    <div class="d-flex align-items-center">
                        <img src="${homePlayer.photo}" alt="${homePlayer.name}" 
                             class="rounded-circle me-2" style="width: 30px; height: 30px; object-fit: cover;"
                             onerror="this.src='${homePlayer.defaultPhoto || 'https://via.placeholder.com/100/1a1a2e/ffffff?text=?'}'">
                        <div>
                            <div class="fw-bold">${homePlayer.name}</div>
                            <small class="text-muted">${homePlayer.strength}</small>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="d-flex align-items-center">
                        <img src="${awayPlayer.photo}" alt="${awayPlayer.name}" 
                             class="rounded-circle me-2" style="width: 30px; height: 30px; object-fit: cover;"
                             onerror="this.src='${awayPlayer.defaultPhoto || 'https://via.placeholder.com/100/1a1a2e/ffffff?text=?'}'">
                        <div>
                            <div class="fw-bold">${awayPlayer.name}</div>
                            <small class="text-muted">${awayPlayer.strength}</small>
                        </div>
                    </div>
                </td>
                <td>${fixture.venue}</td>
                <td>${legBadge} ${statusBadge}</td>
                <td>
                    <button class="btn btn-sm btn-outline-warning me-1" onclick="editFixture(${fixture.id})">
                        <i class="fas fa-edit me-1"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteFixtureHandler(${fixture.id})">
                        <i class="fas fa-trash me-1"></i> Delete
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    updateAdminStatistics();
}

function renderAdminResults() {
    const results = getData(DB_KEYS.RESULTS);
    const players = getData(DB_KEYS.PLAYERS);
    
    // Sort by date (newest first)
    const sortedResults = [...results].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const container = document.getElementById('admin-results-table');
    if (!container) {
        console.error('Results table container not found');
        return;
    }
    
    const tbody = container.querySelector('tbody');
    if (!tbody) {
        console.error('Results table tbody not found');
        return;
    }
    
    tbody.innerHTML = sortedResults.map(result => {
        const homePlayer = players.find(p => p.id === result.homePlayerId);
        const awayPlayer = players.find(p => p.id === result.awayPlayerId);
        
        if (!homePlayer || !awayPlayer) {
            console.warn('Missing player data for result:', result);
            return '';
        }
        
        return `
            <tr>
                <td>${formatDisplayDate(result.date)}</td>
                <td>
                    <div class="d-flex align-items-center">
                        <img src="${homePlayer.photo}" alt="${homePlayer.name}" 
                             class="rounded-circle me-2" style="width: 30px; height: 30px; object-fit: cover;"
                             onerror="this.src='${homePlayer.defaultPhoto || 'https://via.placeholder.com/100/1a1a2e/ffffff?text=?'}'">
                        <div class="fw-bold">${homePlayer.name}</div>
                    </div>
                </td>
                <td>
                    <div class="d-flex align-items-center justify-content-center">
                        <input type="number" class="form-control form-control-sm edit-score text-center" 
                               data-result-id="${result.id}" data-player="home" value="${result.homeScore}" 
                               style="width: 60px;" min="0">
                        <span class="mx-2 fw-bold">-</span>
                        <input type="number" class="form-control form-control-sm edit-score text-center" 
                               data-result-id="${result.id}" data-player="away" value="${result.awayScore}" 
                               style="width: 60px;" min="0">
                    </div>
                </td>
                <td>
                    <div class="d-flex align-items-center">
                        <img src="${awayPlayer.photo}" alt="${awayPlayer.name}" 
                             class="rounded-circle me-2" style="width: 30px; height: 30px; object-fit: cover;"
                             onerror="this.src='${awayPlayer.defaultPhoto || 'https://via.placeholder.com/100/1a1a2e/ffffff?text=?'}'">
                        <div class="fw-bold">${awayPlayer.name}</div>
                    </div>
                </td>
                <td>
                    <button class="btn btn-sm btn-success me-1" onclick="updateResultHandler(${result.id})">
                        <i class="fas fa-sync me-1"></i> Update
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteResultHandler(${result.id})">
                        <i class="fas fa-trash me-1"></i> Delete
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    updateAdminStatistics();
}

// Enhanced Admin action handlers
async function deletePlayerHandler(id) {
    if (confirm('Are you sure you want to delete this player? This will also remove their fixtures and results.')) {
        await deletePlayer(id);
        // The refreshAllDisplays() in deletePlayer() will handle all refreshes
        showNotification('Player deleted successfully!', 'success');
    }
}

async function deleteFixtureHandler(id) {
    if (confirm('Are you sure you want to delete this fixture?')) {
        await deleteFixture(id);
        // The refreshAllDisplays() in deleteFixture() will handle all refreshes
        showNotification('Fixture deleted successfully!', 'success');
    }
}

async function deleteResultHandler(id) {
    if (confirm('Are you sure you want to delete this result?')) {
        await deleteResult(id);
        // The refreshAllDisplays() in deleteResult() will handle all refreshes
        showNotification('Result deleted successfully!', 'success');
    }
}

async function updateResultHandler(id) {
    const result = getData(DB_KEYS.RESULTS).find(r => r.id === id);
    if (!result) return;
    
    const homeScoreInput = document.querySelector(`.edit-score[data-result-id="${id}"][data-player="home"]`);
    const awayScoreInput = document.querySelector(`.edit-score[data-result-id="${id}"][data-player="away"]`);
    
    if (!homeScoreInput || !awayScoreInput) return;
    
    const homeScore = parseInt(homeScoreInput.value);
    const awayScore = parseInt(awayScoreInput.value);
    
    if (isNaN(homeScore) || isNaN(awayScore)) {
        showNotification('Please enter valid scores!', 'error');
        return;
    }
    
    result.homeScore = homeScore;
    result.awayScore = awayScore;
    
    await updateResult(result);
    // The refreshAllDisplays() in updateResult() will handle all refreshes
    showNotification('Result updated successfully!', 'success');
}

function editPlayer(id) {
    const player = getPlayerById(id);
    if (!player) return;
    
    const newName = prompt('Enter new name:', player.name);
    if (newName === null) return;
    
    const newTeam = prompt('Enter new team:', player.team);
    if (newTeam === null) return;
    
    const newPhoto = prompt('Enter new photo URL (leave empty for default):', player.photo);
    
    player.name = newName;
    player.team = newTeam;
    if (newPhoto) player.photo = newPhoto;
    
    updatePlayer(player);
    // The refreshAllDisplays() in updatePlayer() will handle all refreshes
    showNotification('Player updated successfully!', 'success');
}

function editPlayerStrength(id) {
    const player = getPlayerById(id);
    if (!player) return;
    
    const newStrength = prompt('Enter new strength rating:', player.strength);
    if (newStrength === null) return;
    
    const strengthValue = parseInt(newStrength);
    if (isNaN(strengthValue) || strengthValue < 0) {
        showNotification('Please enter a valid strength number!', 'error');
        return;
    }
    
    player.strength = strengthValue;
    
    updatePlayer(player);
    // The refreshAllDisplays() in updatePlayer() will handle all refreshes
    showNotification('Player strength updated successfully!', 'success');
}

function editFixture(id) {
    const fixture = getData(DB_KEYS.FIXTURES).find(f => f.id === id);
    if (!fixture) return;
    
    const newDate = prompt('Enter new date (YYYY-MM-DD):', fixture.date);
    if (newDate === null) return;
    
    const newTime = prompt('Enter new time (HH:MM):', fixture.time);
    if (newTime === null) return;
    
    const newVenue = prompt('Enter new venue:', fixture.venue);
    if (newVenue === null) return;
    
    fixture.date = newDate;
    fixture.time = newTime;
    fixture.venue = newVenue;
    
    updateFixture(fixture);
    // The refreshAllDisplays() in updateFixture() will handle all refreshes
    showNotification('Fixture updated successfully!', 'success');
}

// Enhanced reset functions for both local and MongoDB
function resetTournament() {
    if (confirm('⚠️ DANGER: This will reset the entire tournament and delete all LOCAL data! This cannot be undone. Continue?')) {
        // Clear local storage
        localStorage.removeItem(DB_KEYS.PLAYERS);
        localStorage.removeItem(DB_KEYS.FIXTURES);
        localStorage.removeItem(DB_KEYS.RESULTS);
        
        // Reinitialize with default players
        initializeDatabase();
        
        showNotification('Local tournament data has been reset to default settings!', 'success');
        // The initializeDatabase() will trigger refreshes
    }
}

async function resetMongoDB() {
    if (confirm('⚠️ DANGER: This will reset the ENTIRE tournament in MongoDB database! This cannot be undone. Continue?')) {
        try {
            showNotification('Resetting MongoDB database...', 'info');
            
            const response = await fetch('/api/initialize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const result = await response.json();
            
            if (result.success) {
                showNotification('MongoDB database reset successfully! Re-syncing data...', 'success');
                
                // Clear local storage first
                localStorage.removeItem(DB_KEYS.PLAYERS);
                localStorage.removeItem(DB_KEYS.FIXTURES);
                localStorage.removeItem(DB_KEYS.RESULTS);
                
                // Reinitialize database which will pull from MongoDB
                await initializeDatabase();
                
                // The initializeDatabase() will trigger refreshes
                
                showNotification('MongoDB reset complete! All data has been re-synced.', 'success');
            } else {
                showNotification('Failed to reset MongoDB: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('MongoDB reset failed:', error);
            showNotification('Failed to reset MongoDB. Server might be offline. Using local data only.', 'error');
        }
    }
}

// Enhanced reset all results function
function resetAllResults() {
    if (confirm('This will clear all match results but keep players and fixtures. Continue?')) {
        // Clear local results
        saveData(DB_KEYS.RESULTS, []);
        
        // Mark all fixtures as unplayed locally
        const fixtures = getData(DB_KEYS.FIXTURES);
        fixtures.forEach(fixture => {
            fixture.played = false;
        });
        saveData(DB_KEYS.FIXTURES, fixtures);
        
        // Also try to reset results in MongoDB
        resetMongoDBResults();
        
        // Refresh all displays
        refreshAllDisplays();
        
        showNotification('All results have been cleared!', 'success');
    }
}

// Function to reset only results in MongoDB
async function resetMongoDBResults() {
    try {
        // Get all results from MongoDB and delete them
        const results = await eflAPI.getResults();
        
        // Delete each result
        for (const result of results) {
            await eflAPI.deleteResult(result.id);
        }
        
        // Update fixtures to mark as unplayed
        const fixtures = await eflAPI.getFixtures();
        for (const fixture of fixtures) {
            if (fixture.played) {
                fixture.played = false;
                await eflAPI.updateFixture(fixture.id, fixture);
            }
        }
        
        console.log('MongoDB results reset successfully');
    } catch (error) {
        console.log('MongoDB results reset failed, using local only:', error);
    }
}

// Admin Notification Handler
async function handleAdminNotificationSubmit() {
    const title = document.getElementById('notification-title').value.trim();
    const message = document.getElementById('notification-message').value.trim();
    const type = document.getElementById('notification-type').value;
    const priority = document.getElementById('notification-priority').value;
    const target = document.querySelector('input[name="target-audience"]:checked').value;
    
    if (!title || !message) {
        showNotification('Please fill in all fields!', 'error');
        return;
    }
    
    try {
        // Send the notification using your tournamentUpdates system
        if (typeof tournamentUpdates !== 'undefined') {
            const notification = tournamentUpdates.sendAdminPushNotification(
                title, 
                message, 
                type, 
                priority, 
                target
            );
            
            // Reset form
            document.getElementById('push-notification-form').reset();
            
            showNotification(`Notification sent to ${target === 'all' ? 'all users' : 'players only'}!`, 'success');
            
            return notification;
        } else {
            throw new Error('Notification system not available');
        }
    } catch (error) {
        console.error('Error sending notification:', error);
        showNotification('Failed to send notification: ' + error.message, 'error');
    }
}

// Event Listeners for admin
function setupAdminEventListeners() {
    console.log('Setting up admin event listeners...');

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
                // The refreshAllDisplays() in addPlayer() will handle all refreshes
            } catch (error) {
                // Error handling is done in addPlayer function
            }
        });
    } else {
        console.error('Add player form not found');
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
            
            await addFixture({ homePlayerId, awayPlayerId, date, time, venue });
            this.reset();
            // The refreshAllDisplays() in addFixture() will handle all refreshes
        });
    } else {
        console.error('Add fixture form not found');
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
            
            await addResult({ homePlayerId, awayPlayerId, homeScore, awayScore, date });
            this.reset();
            // The refreshAllDisplays() in addResult() will handle all refreshes
        });
    } else {
        console.error('Add result form not found');
    }
    
    // Admin Notification Form
    const pushNotificationForm = document.getElementById('push-notification-form');
    if (pushNotificationForm) {
        pushNotificationForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleAdminNotificationSubmit();
        });
        console.log('Push notification form listener added');
    } else {
        console.error('Push notification form not found');
    }
    
    // Export data
    const exportButton = document.getElementById('export-data');
    if (exportButton) {
        exportButton.addEventListener('click', function() {
            const players = getData(DB_KEYS.PLAYERS);
            const fixtures = getData(DB_KEYS.FIXTURES);
            const results = getData(DB_KEYS.RESULTS);
            
            const data = {
                players,
                fixtures,
                results,
                exportDate: new Date().toISOString(),
                tournament: 'eFootball League 2025'
            };
            
            const dataStr = JSON.stringify(data, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'efootball_tournament_data.json';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showNotification('Tournament data exported successfully!', 'success');
        });
    } else {
        console.error('Export data button not found');
    }
    
    // Populate team options with updated teams
    const teamSelect = document.getElementById('playerTeam');
    if (teamSelect) {
        teamSelect.innerHTML = '<option value="" selected disabled>Select team</option>' +
            BALANCED_TEAMS.map(team => 
                `<option value="${team.name}">${team.name} (Strength: ${team.strength})</option>`
            ).join('');
    }
}

// Initialize admin dashboard
document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin page loaded, checking authentication...');
    
    if (window.location.pathname.includes('admin.html') && checkAdminAuth()) {
        console.log('Admin authenticated, initializing dashboard...');
        
        // Force re-initialization of database to ensure players exist
        initializeDatabase();
        
        setupAdminEventListeners();
        populatePlayerSelects();
        renderAdminPlayers();
        renderAdminFixtures();
        renderAdminResults();
        
        // Initialize notification system
        initializeAdminNotifications();
        
        // Set today's date as default for date inputs
        const today = new Date().toISOString().split('T')[0];
        const fixtureDate = document.getElementById('fixtureDate');
        const matchDateResult = document.getElementById('matchDateResult');
        
        if (fixtureDate) fixtureDate.value = today;
        if (matchDateResult) matchDateResult.value = today;
        
        console.log('Admin dashboard initialized successfully');
    }

    // Auto-close navbar on mobile when links are clicked
    const navbarCollapse = document.querySelector('.navbar-collapse');
    const navLinks = document.querySelectorAll('.nav-link');
    
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

// Initialize admin notifications
function initializeAdminNotifications() {
    if (typeof tournamentUpdates !== 'undefined') {
        // Setup the notification form
        tournamentUpdates.setupAdminNotificationForm();
        
        // Load initial notification history
        tournamentUpdates.loadAdminNotificationHistory();
        
        // Update notification statistics
        tournamentUpdates.updateAdminStatistics();
        
        console.log('Admin notifications initialized');
    } else {
        console.warn('Tournament updates system not available');
    }
        }
