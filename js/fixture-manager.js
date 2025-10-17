// Advanced Fixture Management System
class FixtureManager {
    constructor() {
        this.venues = [
            'Virtual Stadium A',
            'Virtual Stadium B', 
            'Virtual Stadium C',
            'Virtual Stadium D',
            'Main Arena',
            'Champions Field',
            'Elite Arena'
        ];
        
        this.timeSlots = [
            '14:00', '15:00', '16:00', '17:00', 
            '18:00', '19:00', '20:00', '21:00'
        ];
        
        this.minDaysBetweenMatches = 2;
        this.maxMatchesPerDay = 4;
        this.maxMatchesPerWeek = 2;
        
        this.init();
    }

    init() {
        // Add fixture management UI to admin panel
        this.addFixtureManagementUI();
    }

    addFixtureManagementUI() {
        // This will be called when admin panel loads
        // UI elements are added in admin.js
    }

    // Generate optimized fixtures
    generateOptimizedFixtures() {
        const players = getData(DB_KEYS.PLAYERS);
        
        if (players.length < 2) {
            showNotification('Need at least 2 players to generate fixtures', 'error');
            return;
        }

        if (confirm('This will replace all existing fixtures with an optimized schedule. Continue?')) {
            showNotification('Generating optimized fixtures...', 'info');
            
            setTimeout(() => {
                try {
                    const fixtures = this.createOptimizedFixtures(players);
                    this.saveOptimizedFixtures(fixtures);
                    showNotification('✅ Optimized fixtures generated successfully!', 'success');
                    
                    // Refresh fixtures display
                    if (typeof renderAdminFixtures === 'function') {
                        renderAdminFixtures();
                    }
                    
                    // Show fixture report
                    this.showFixtureReport();
                    
                } catch (error) {
                    console.error('Fixture generation failed:', error);
                    showNotification('❌ Failed to generate fixtures: ' + error.message, 'error');
                }
            }, 100);
        }
    }

    createOptimizedFixtures(players) {
        const fixtures = [];
        let fixtureId = this.getNextFixtureId();
        
        // Generate all possible match combinations
        const matchPairs = [];
        for (let i = 0; i < players.length; i++) {
            for (let j = i + 1; j < players.length; j++) {
                matchPairs.push({
                    homePlayer: players[i],
                    awayPlayer: players[j],
                    strengthDiff: Math.abs(players[i].strength - players[j].strength)
                });
            }
        }

        // Sort match pairs by strength difference (closer matches first)
        matchPairs.sort((a, b) => a.strengthDiff - b.strengthDiff);

        // Create optimized schedule
        const schedule = this.createBalancedSchedule(matchPairs, players);
        
        // Convert schedule to fixtures
        schedule.forEach((daySchedule, dayIndex) => {
            const date = new Date();
            date.setDate(date.getDate() + dayIndex * this.minDaysBetweenMatches);
            const dateString = date.toISOString().split('T')[0];
            const venue = this.venues[dayIndex % this.venues.length];

            daySchedule.forEach((match, matchIndex) => {
                const time = this.timeSlots[matchIndex % this.timeSlots.length];
                
                fixtures.push({
                    id: fixtureId++,
                    homePlayerId: match.homePlayer.id,
                    awayPlayerId: match.awayPlayer.id,
                    date: dateString,
                    time: time,
                    venue: venue,
                    played: false,
                    isHomeLeg: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            });
        });

        return fixtures;
    }

    createBalancedSchedule(matchPairs, players) {
        const schedule = [];
        let currentDay = [];
        const playerMatchCount = new Map();
        
        // Initialize match counts
        players.forEach(player => {
            playerMatchCount.set(player.id, 0);
        });

        let dayIndex = 0;
        
        while (matchPairs.length > 0) {
            const availableMatches = matchPairs.filter(match => 
                this.canScheduleMatch(currentDay, match, playerMatchCount, dayIndex)
            );

            if (availableMatches.length > 0) {
                // Pick the best available match (closest strength)
                const bestMatch = availableMatches[0];
                currentDay.push(bestMatch);
                
                // Update player match counts
                playerMatchCount.set(bestMatch.homePlayer.id, playerMatchCount.get(bestMatch.homePlayer.id) + 1);
                playerMatchCount.set(bestMatch.awayPlayer.id, playerMatchCount.get(bestMatch.awayPlayer.id) + 1);
                
                // Remove from available pairs
                const matchIndex = matchPairs.findIndex(m => 
                    m.homePlayer.id === bestMatch.homePlayer.id && 
                    m.awayPlayer.id === bestMatch.awayPlayer.id
                );
                if (matchIndex > -1) {
                    matchPairs.splice(matchIndex, 1);
                }
            } else {
                // Start new day
                if (currentDay.length > 0) {
                    schedule.push([...currentDay]);
                    dayIndex++;
                }
                currentDay = [];
                
                // If still no matches available, force one
                if (matchPairs.length > 0 && currentDay.length === 0) {
                    const forcedMatch = matchPairs.shift();
                    currentDay.push(forcedMatch);
                    playerMatchCount.set(forcedMatch.homePlayer.id, playerMatchCount.get(forcedMatch.homePlayer.id) + 1);
                    playerMatchCount.set(forcedMatch.awayPlayer.id, playerMatchCount.get(forcedMatch.awayPlayer.id) + 1);
                }
            }

            // Force new day if max matches reached
            if (currentDay.length >= this.maxMatchesPerDay) {
                schedule.push([...currentDay]);
                currentDay = [];
                dayIndex++;
            }
        }

        // Add remaining matches
        if (currentDay.length > 0) {
            schedule.push(currentDay);
        }

        return schedule;
    }

    canScheduleMatch(dayMatches, match, playerMatchCount, dayIndex) {
        // Check if players already have matches this day
        for (const dayMatch of dayMatches) {
            if (dayMatch.homePlayer.id === match.homePlayer.id ||
                dayMatch.homePlayer.id === match.awayPlayer.id ||
                dayMatch.awayPlayer.id === match.homePlayer.id ||
                dayMatch.awayPlayer.id === match.awayPlayer.id) {
                return false;
            }
        }

        // Check if players have reached weekly limit
        const homePlayerWeeklyMatches = this.getPlayerMatchesThisWeek(match.homePlayer.id, dayIndex);
        const awayPlayerWeeklyMatches = this.getPlayerMatchesThisWeek(match.awayPlayer.id, dayIndex);
        
        if (homePlayerWeeklyMatches >= this.maxMatchesPerWeek || 
            awayPlayerWeeklyMatches >= this.maxMatchesPerWeek) {
            return false;
        }

        return true;
    }

    getPlayerMatchesThisWeek(playerId, currentDayIndex) {
        // Simplified weekly match count
        // In a real implementation, you'd track actual dates
        const daysInWeek = 7 / this.minDaysBetweenMatches;
        return Math.floor(currentDayIndex / daysInWeek) * this.maxMatchesPerWeek;
    }

    saveOptimizedFixtures(fixtures) {
        saveData(DB_KEYS.FIXTURES, fixtures);
        
        // Also sync with MongoDB if available
        if (typeof eflAPI !== 'undefined' && eflAPI.isOnline) {
            this.syncFixturesWithMongoDB(fixtures);
        }
    }

    async syncFixturesWithMongoDB(fixtures) {
        try {
            // Clear existing fixtures
            const existingFixtures = await eflAPI.getFixtures();
            for (const fixture of existingFixtures) {
                await eflAPI.deleteFixture(fixture.id);
            }
            
            // Add new fixtures
            for (const fixture of fixtures) {
                await eflAPI.addFixture(fixture);
            }
            
            console.log('✅ Fixtures synced with MongoDB');
        } catch (error) {
            console.log('MongoDB sync failed, using local storage:', error);
        }
    }

    // Check for fixture congestion
    checkFixtureCongestion(playerId) {
        const fixtures = getData(DB_KEYS.FIXTURES);
        const playerFixtures = fixtures.filter(f => 
            f.homePlayerId === playerId || f.awayPlayerId === playerId
        );
        
        // Check last 7 days
        const recentFixtures = playerFixtures.filter(f => {
            const fixtureDate = new Date(f.date);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return fixtureDate > weekAgo && !f.played;
        });

        return {
            hasCongestion: recentFixtures.length > this.maxMatchesPerWeek,
            matchesInLastWeek: recentFixtures.length,
            recommendation: recentFixtures.length > this.maxMatchesPerWeek ? 
                'Consider rescheduling some matches' : 'Schedule looks good'
        };
    }

    // Check home/away balance
    checkHomeAwayBalance(playerId) {
        const fixtures = getData(DB_KEYS.FIXTURES);
        const playerFixtures = fixtures.filter(f => 
            f.homePlayerId === playerId || f.awayPlayerId === playerId
        );
        
        const homeMatches = playerFixtures.filter(f => f.homePlayerId === playerId).length;
        const awayMatches = playerFixtures.filter(f => f.awayPlayerId === playerId).length;
        
        const totalMatches = homeMatches + awayMatches;
        const balance = homeMatches - awayMatches;
        const balancePercentage = totalMatches > 0 ? (homeMatches / totalMatches) * 100 : 50;
        
        let status = 'balanced';
        if (Math.abs(balance) > 2) status = 'critical';
        else if (Math.abs(balance) > 1) status = 'warning';
        
        return {
            homeMatches,
            awayMatches,
            totalMatches,
            balance,
            balancePercentage,
            status,
            isBalanced: Math.abs(balance) <= 1,
            recommendation: balance > 1 ? 'Schedule more away matches' : 
                           balance < -1 ? 'Schedule more home matches' : 'Well balanced'
        };
    }

    // Detect date conflicts
    detectDateConflicts() {
        const fixtures = getData(DB_KEYS.FIXTURES);
        const conflicts = [];
        const dateMap = new Map();

        fixtures.forEach(fixture => {
            const dateKey = fixture.date;
            if (!dateMap.has(dateKey)) {
                dateMap.set(dateKey, []);
            }
            dateMap.get(dateKey).push(fixture);
        });

        dateMap.forEach((dayFixtures, date) => {
            const playerAppearances = new Map();
            const venueUsage = new Map();
            
            dayFixtures.forEach(fixture => {
                // Check player conflicts
                [fixture.homePlayerId, fixture.awayPlayerId].forEach(playerId => {
                    if (playerAppearances.has(playerId)) {
                        conflicts.push({
                            type: 'PLAYER_CONFLICT',
                            date: date,
                            playerId: playerId,
                            fixture1: playerAppearances.get(playerId),
                            fixture2: fixture.id,
                            message: `Player has multiple matches on ${date}`
                        });
                    }
                    playerAppearances.set(playerId, fixture.id);
                });

                // Check venue conflicts
                if (!venueUsage.has(fixture.venue)) {
                    venueUsage.set(fixture.venue, []);
                }
                venueUsage.get(fixture.venue).push(fixture);
                
                if (venueUsage.get(fixture.venue).length > 1) {
                    // Check if venue is used at the same time
                    const sameVenueFixtures = venueUsage.get(fixture.venue);
                    const timeConflicts = sameVenueFixtures.filter(f => f.time === fixture.time);
                    
                    if (timeConflicts.length > 1) {
                        conflicts.push({
                            type: 'VENUE_CONFLICT',
                            date: date,
                            venue: fixture.venue,
                            time: fixture.time,
                            fixtures: timeConflicts.map(f => f.id),
                            message: `Venue ${fixture.venue} has multiple matches at ${fixture.time} on ${date}`
                        });
                    }
                }
            });
        });

        return conflicts;
    }

    // Reschedule fixture with conflict resolution
    rescheduleFixture(fixtureId, newDate, newTime, newVenue) {
        const fixtures = getData(DB_KEYS.FIXTURES);
        const fixtureIndex = fixtures.findIndex(f => f.id === fixtureId);
        
        if (fixtureIndex === -1) {
            return { success: false, message: 'Fixture not found' };
        }

        const originalFixture = fixtures[fixtureIndex];
        
        // Check if new schedule creates conflicts
        const tempFixtures = [...fixtures];
        tempFixtures[fixtureIndex] = {
            ...originalFixture,
            date: newDate,
            time: newTime,
            venue: newVenue,
            updatedAt: new Date()
        };
        
        const conflicts = this.detectDateConflicts(tempFixtures);
        const relevantConflicts = conflicts.filter(conflict => 
            conflict.date === newDate && 
            (conflict.playerId === originalFixture.homePlayerId || 
             conflict.playerId === originalFixture.awayPlayerId ||
             (conflict.venue === newVenue && conflict.time === newTime))
        );
        
        if (relevantConflicts.length === 0) {
            // No conflicts, apply changes
            fixtures[fixtureIndex] = tempFixtures[fixtureIndex];
            saveData(DB_KEYS.FIXTURES, fixtures);
            
            // Sync with MongoDB
            if (typeof eflAPI !== 'undefined' && eflAPI.isOnline) {
                eflAPI.updateFixture(fixtureId, fixtures[fixtureIndex]);
            }
            
            return { 
                success: true, 
                message: 'Fixture rescheduled successfully',
                fixture: fixtures[fixtureIndex]
            };
        } else {
            return { 
                success: false, 
                message: 'Schedule conflict detected', 
                conflicts: relevantConflicts 
            };
        }
    }

    // Get next available fixture ID
    getNextFixtureId() {
        const fixtures = getData(DB_KEYS.FIXTURES);
        return fixtures.length > 0 ? Math.max(...fixtures.map(f => f.id)) + 1 : 1;
    }

    // Generate fixture report
    generateFixtureReport() {
        const fixtures = getData(DB_KEYS.FIXTURES);
        const players = getData(DB_KEYS.PLAYERS);
        const results = getData(DB_KEYS.RESULTS);
        
        const report = {
            generatedAt: new Date().toISOString(),
            summary: {
                totalFixtures: fixtures.length,
                playedFixtures: fixtures.filter(f => f.played).length,
                upcomingFixtures: fixtures.filter(f => !f.played).length,
                totalPlayers: players.length,
                completionPercentage: fixtures.length > 0 ? 
                    (fixtures.filter(f => f.played).length / fixtures.length) * 100 : 0
            },
            venueUsage: this.getVenueUsage(fixtures),
            playerSchedules: this.getPlayerSchedules(players, fixtures),
            conflicts: this.detectDateConflicts(),
            recommendations: this.getSchedulingRecommendations(players, fixtures),
            upcomingSchedule: this.getUpcomingSchedule(fixtures, 7) // Next 7 days
        };
        
        return report;
    }

    getVenueUsage(fixtures) {
        const usage = {};
        const upcomingUsage = {};
        
        fixtures.forEach(fixture => {
            usage[fixture.venue] = (usage[fixture.venue] || 0) + 1;
            if (!fixture.played) {
                upcomingUsage[fixture.venue] = (upcomingUsage[fixture.venue] || 0) + 1;
            }
        });
        
        return {
            total: usage,
            upcoming: upcomingUsage,
            mostUsed: Object.keys(usage).reduce((a, b) => usage[a] > usage[b] ? a : b),
            leastUsed: Object.keys(usage).reduce((a, b) => usage[a] < usage[b] ? a : b)
        };
    }

    getPlayerSchedules(players, fixtures) {
        return players.map(player => {
            const playerFixtures = fixtures.filter(f => 
                f.homePlayerId === player.id || f.awayPlayerId === player.id
            );
            
            const congestion = this.checkFixtureCongestion(player.id);
            const balance = this.checkHomeAwayBalance(player.id);
            
            return {
                playerId: player.id,
                playerName: player.name,
                totalMatches: playerFixtures.length,
                playedMatches: playerFixtures.filter(f => f.played).length,
                upcomingMatches: playerFixtures.filter(f => !f.played).length,
                homeMatches: playerFixtures.filter(f => f.homePlayerId === player.id).length,
                awayMatches: playerFixtures.filter(f => f.awayPlayerId === player.id).length,
                congestion: congestion,
                balance: balance,
                nextMatch: this.getNextPlayerMatch(player.id, fixtures),
                lastMatch: this.getLastPlayerMatch(player.id, fixtures)
            };
        });
    }

    getNextPlayerMatch(playerId, fixtures) {
        const upcoming = fixtures
            .filter(f => !f.played && (f.homePlayerId === playerId || f.awayPlayerId === playerId))
            .sort((a, b) => new Date(a.date) - new Date(b.date));
        
        return upcoming.length > 0 ? upcoming[0] : null;
    }

    getLastPlayerMatch(playerId, fixtures) {
        const played = fixtures
            .filter(f => f.played && (f.homePlayerId === playerId || f.awayPlayerId === playerId))
            .sort((a, b) => new Date(b.date) - new Date(a.date));
        
        return played.length > 0 ? played[0] : null;
    }

    getSchedulingRecommendations(players, fixtures) {
        const recommendations = [];
        
        // Check each player's schedule
        players.forEach(player => {
            const congestion = this.checkFixtureCongestion(player.id);
            const balance = this.checkHomeAwayBalance(player.id);
            
            if (congestion.hasCongestion) {
                recommendations.push({
                    type: 'CONGESTION',
                    player: player.name,
                    priority: 'HIGH',
                    matchesInWeek: congestion.matchesInLastWeek,
                    message: `${player.name} has ${congestion.matchesInLastWeek} matches in the last week - consider rescheduling`,
                    suggestion: 'Spread matches more evenly across weeks'
                });
            }
            
            if (!balance.isBalanced) {
                recommendations.push({
                    type: 'BALANCE',
                    player: player.name,
                    priority: balance.status === 'critical' ? 'HIGH' : 'MEDIUM',
                    homeMatches: balance.homeMatches,
                    awayMatches: balance.awayMatches,
                    message: `${player.name} has home/away imbalance (${balance.homeMatches}H/${balance.awayMatches}A)`,
                    suggestion: balance.recommendation
                });
            }
        });
        
        // Check venue usage
        const venueUsage = this.getVenueUsage(fixtures);
        const totalFixtures = fixtures.length;
        const expectedPerVenue = totalFixtures / Object.keys(venueUsage.total).length;
        
        Object.entries(venueUsage.total).forEach(([venue, count]) => {
            if (count > expectedPerVenue * 1.5) {
                recommendations.push({
                    type: 'VENUE_OVERUSE',
                    venue: venue,
                    priority: 'LOW',
                    usage: count,
                    expected: Math.round(expectedPerVenue),
                    message: `Venue ${venue} is being overused (${count} matches vs expected ${Math.round(expectedPerVenue)})`,
                    suggestion: 'Consider using other venues more frequently'
                });
            }
        });
        
        // Check for date conflicts
        const conflicts = this.detectDateConflicts();
        if (conflicts.length > 0) {
            recommendations.push({
                type: 'CONFLICTS',
                priority: 'HIGH',
                conflictCount: conflicts.length,
                message: `Found ${conflicts.length} scheduling conflicts that need resolution`,
                suggestion: 'Use the conflict resolution tool to fix these issues'
            });
        }
        
        return recommendations.sort((a, b) => {
            const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }

    getUpcomingSchedule(fixtures, days = 7) {
        const today = new Date();
        const endDate = new Date();
        endDate.setDate(today.getDate() + days);
        
        const upcoming = fixtures
            .filter(f => !f.played && new Date(f.date) <= endDate)
            .sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Group by date
        const schedule = {};
        upcoming.forEach(fixture => {
            if (!schedule[fixture.date]) {
                schedule[fixture.date] = [];
            }
            schedule[fixture.date].push(fixture);
        });
        
        return schedule;
    }

    // Show fixture report in UI
    showFixtureReport() {
        const report = this.generateFixtureReport();
        
        // Create modal or display report
        const reportHTML = this.generateReportHTML(report);
        
        // Show in a modal or dedicated section
        this.showModal('Fixture Analysis Report', reportHTML);
    }

    generateReportHTML(report) {
        return `
            <div class="fixture-report">
                <div class="row mb-4">
                    <div class="col-md-3">
                        <div class="card text-center">
                            <div class="card-body">
                                <h3>${report.summary.totalFixtures}</h3>
                                <p class="mb-0">Total Fixtures</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-center">
                            <div class="card-body">
                                <h3 class="text-success">${report.summary.playedFixtures}</h3>
                                <p class="mb-0">Played</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-center">
                            <div class="card-body">
                                <h3 class="text-warning">${report.summary.upcomingFixtures}</h3>
                                <p class="mb-0">Upcoming</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-center">
                            <div class="card-body">
                                <h3>${Math.round(report.summary.completionPercentage)}%</h3>
                                <p class="mb-0">Completion</p>
                            </div>
                        </div>
                    </div>
                </div>

                ${report.recommendations.length > 0 ? `
                    <div class="card mb-4">
                        <div class="card-header">
                            <h5 class="mb-0">Recommendations</h5>
                        </div>
                        <div class="card-body">
                            ${report.recommendations.map(rec => `
                                <div class="alert alert-${rec.priority === 'HIGH' ? 'danger' : rec.priority === 'MEDIUM' ? 'warning' : 'info'}">
                                    <strong>${rec.type}</strong>: ${rec.message}
                                    ${rec.suggestion ? `<br><small>Suggestion: ${rec.suggestion}</small>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">Player Schedule Analysis</h5>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-dark table-hover">
                                <thead>
                                    <tr>
                                        <th>Player</th>
                                        <th>Total</th>
                                        <th>Home/Away</th>
                                        <th>Balance</th>
                                        <th>Congestion</th>
                                        <th>Next Match</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${report.playerSchedules.map(player => `
                                        <tr>
                                            <td>${player.playerName}</td>
                                            <td>${player.totalMatches}</td>
                                            <td>${player.homeMatches}H/${player.awayMatches}A</td>
                                            <td>
                                                <span class="badge ${player.balance.status === 'balanced' ? 'bg-success' : player.balance.status === 'warning' ? 'bg-warning' : 'bg-danger'}">
                                                    ${player.balance.isBalanced ? 'Good' : 'Needs Attention'}
                                                </span>
                                            </td>
                                            <td>
                                                <span class="badge ${player.congestion.hasCongestion ? 'bg-danger' : 'bg-success'}">
                                                    ${player.congestion.matchesInLastWeek}/week
                                                </span>
                                            </td>
                                            <td>
                                                ${player.nextMatch ? 
                                                    `${this.formatDisplayDate(player.nextMatch.date)} ${player.nextMatch.time}` : 
                                                    'No upcoming'
                                                }
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    showModal(title, content) {
        // Create and show a Bootstrap modal with the content
        const modalId = 'fixtureReportModal';
        let modal = document.getElementById(modalId);
        
        if (!modal) {
            modal = document.createElement('div');
            modal.id = modalId;
            modal.className = 'modal fade';
            modal.innerHTML = `
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${title}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            ${content}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-primary" onclick="imageExporter.exportLeagueTable()">
                                <i class="fas fa-image me-1"></i> Export Report
                            </button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        } else {
            modal.querySelector('.modal-title').textContent = title;
            modal.querySelector('.modal-body').innerHTML = content;
        }
        
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }

    formatDisplayDate(dateString) {
        const options = { day: 'numeric', month: 'short' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }
}

// Initialize fixture manager
const fixtureManager = new FixtureManager();

// Global access
window.fixtureManager = fixtureManager;

// Helper functions for admin panel integration
function generateOptimizedFixtures() {
    fixtureManager.generateOptimizedFixtures();
}

function showFixtureReport() {
    fixtureManager.showFixtureReport();
}

function checkFixtureConflicts() {
    const conflicts = fixtureManager.detectDateConflicts();
    
    if (conflicts.length === 0) {
        showNotification('✅ No scheduling conflicts found!', 'success');
    } else {
        let message = `Found ${conflicts.length} scheduling conflict(s):\n`;
        conflicts.forEach(conflict => {
            message += `• ${conflict.message}\n`;
        });
        
        alert(message);
        fixtureManager.showFixtureReport();
    }
}

function showRescheduleTool() {
    showNotification('Reschedule tool will be available in the fixtures management section', 'info');
}
