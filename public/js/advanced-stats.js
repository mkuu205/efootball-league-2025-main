// Advanced Fixture Management System
import { getData, saveData, deleteData, DB_KEYS, getSupabase } from './database.js'; // ✅ ADD getSupabase

// ✅ ADD: Get the supabase client instance
const supabase = getSupabase();

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
        console.log('Fixture Manager initialized');
        this.addFixtureManagementUI();
    }

    addFixtureManagementUI() {
        // UI elements are added in admin.js
        console.log('Fixture management UI ready');
    }

    // Generate optimized fixtures - Champions League Format
    async generateOptimizedFixtures() {
        const players = await getData(DB_KEYS.PLAYERS);
        
        if (players.length < 2) {
            showNotification('Need at least 2 players to generate fixtures', 'error');
            return;
        }

        if (confirm('This will replace all existing fixtures with Champions League format (Groups → Quarters → Semis → Final). Continue?')) {
            showNotification('Generating Champions League fixtures...', 'info');
            
            try {
                const fixtures = await this.createChampionsLeagueFixtures(players);
                await this.saveOptimizedFixtures(fixtures);
                showNotification('✅ Champions League fixtures generated successfully!', 'success');
                
                // Refresh fixtures display
                if (typeof renderAdminFixtures === 'function') {
                    await renderAdminFixtures();
                }
                
                // Show fixture report
                this.showFixtureReport();
                
            } catch (error) {
                console.error('Fixture generation failed:', error);
                showNotification('❌ Failed to generate fixtures: ' + error.message, 'error');
            }
        }
    }

    // Create Champions League format fixtures
    async createChampionsLeagueFixtures(players) {
        const fixtures = [];
        let fixtureId = await this.getNextFixtureId();
        const baseDate = new Date();
        let currentDateOffset = 0;

        // Shuffle players for random group assignment
        const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
        
        // Create 2 groups of 5 players each (or adjust if not exactly 10)
        const groupSize = Math.ceil(shuffledPlayers.length / 2);
        const groupA = shuffledPlayers.slice(0, groupSize);
        const groupB = shuffledPlayers.slice(groupSize);
        
        console.log(`Group A: ${groupA.length} players, Group B: ${groupB.length} players`);

        // ========== GROUP STAGE ==========
        // Generate round-robin fixtures within each group
        const groups = [groupA, groupB];
        groups.forEach((group, groupIndex) => {
            const groupName = groupIndex === 0 ? 'A' : 'B';
            
            // Generate all match pairs within group (home and away)
            for (let i = 0; i < group.length; i++) {
                for (let j = i + 1; j < group.length; j++) {
                    // Home match
                    const homeDate = new Date(baseDate);
                    homeDate.setDate(homeDate.getDate() + currentDateOffset);
                    fixtures.push({
                        id: fixtureId++,
                        home_player_id: group[i].id,
                        away_player_id: group[j].id,
                        date: homeDate.toISOString().split('T')[0],
                        time: this.timeSlots[currentDateOffset % this.timeSlots.length],
                        venue: this.venues[currentDateOffset % this.venues.length],
                        played: false,
                        stage: 'group',
                        group: groupName,
                        round: `Group ${groupName}`,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    });
                    
                    currentDateOffset += this.minDaysBetweenMatches;
                    
                    // Away match (reverse fixture)
                    const awayDate = new Date(baseDate);
                    awayDate.setDate(awayDate.getDate() + currentDateOffset);
                    fixtures.push({
                        id: fixtureId++,
                        home_player_id: group[j].id,
                        away_player_id: group[i].id,
                        date: awayDate.toISOString().split('T')[0],
                        time: this.timeSlots[currentDateOffset % this.timeSlots.length],
                        venue: this.venues[currentDateOffset % this.venues.length],
                        played: false,
                        stage: 'group',
                        group: groupName,
                        round: `Group ${groupName}`,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    });
                    
                    currentDateOffset += this.minDaysBetweenMatches;
                }
            }
        });

        // ========== QUARTER-FINALS ==========
        // Top 2 from each group advance (4 teams total)
        // For now, create placeholder fixtures that will be populated after group stage
        const quarterDate = new Date(baseDate);
        quarterDate.setDate(quarterDate.getDate() + currentDateOffset + 7); // 1 week after group stage
        
        // QF1: Group A Winner vs Group B Runner-up
        fixtures.push({
            id: fixtureId++,
            home_player_id: null, // Will be set after group stage
            away_player_id: null,
            date: quarterDate.toISOString().split('T')[0],
            time: '15:00',
            venue: 'Champions Field',
            played: false,
            stage: 'quarter-final',
            group: null,
            round: 'Quarter-Final 1',
            home_team_qualifier: 'Group A Winner',
            away_team_qualifier: 'Group B Runner-up',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });

        // QF2: Group B Winner vs Group A Runner-up
        const qf2Date = new Date(quarterDate);
        qf2Date.setDate(qf2Date.getDate() + 1);
        fixtures.push({
            id: fixtureId++,
            home_player_id: null,
            away_player_id: null,
            date: qf2Date.toISOString().split('T')[0],
            time: '15:00',
            venue: 'Champions Field',
            played: false,
            stage: 'quarter-final',
            group: null,
            round: 'Quarter-Final 2',
            home_team_qualifier: 'Group B Winner',
            away_team_qualifier: 'Group A Runner-up',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });

        // ========== SEMI-FINALS ==========
        const semiDate = new Date(quarterDate);
        semiDate.setDate(semiDate.getDate() + 7); // 1 week after quarter-finals
        
        // SF1: Winner of QF1 vs Winner of QF2
        fixtures.push({
            id: fixtureId++,
            home_player_id: null,
            away_player_id: null,
            date: semiDate.toISOString().split('T')[0],
            time: '18:00',
            venue: 'Main Arena',
            played: false,
            stage: 'semi-final',
            group: null,
            round: 'Semi-Final 1',
            home_team_qualifier: 'QF1 Winner',
            away_team_qualifier: 'QF2 Winner',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });

        // ========== FINAL ==========
        const finalDate = new Date(semiDate);
        finalDate.setDate(finalDate.getDate() + 7); // 1 week after semi-finals
        
        fixtures.push({
            id: fixtureId++,
            home_player_id: null,
            away_player_id: null,
            date: finalDate.toISOString().split('T')[0],
            time: '20:00',
            venue: 'Champions Field',
            played: false,
            stage: 'final',
            group: null,
            round: 'Final',
            home_team_qualifier: 'SF1 Winner',
            away_team_qualifier: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });

        return fixtures;
    }

    // Legacy method for backward compatibility
    createOptimizedFixtures(players) {
        return this.createChampionsLeagueFixtures(players);
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
        const daysInWeek = Math.floor(7 / this.minDaysBetweenMatches);
        return Math.floor(currentDayIndex / daysInWeek) * this.maxMatchesPerWeek;
    }

    async saveOptimizedFixtures(fixtures) {
        // Clear existing fixtures first
        const existingFixtures = await getData(DB_KEYS.FIXTURES);
        if (existingFixtures && existingFixtures.length > 0) {
            for (const fixture of existingFixtures) {
                try {
                    await deleteData(DB_KEYS.FIXTURES, fixture.id);
                } catch (err) {
                    console.warn('Could not delete fixture:', err);
                }
            }
        }
        
        // Save new fixtures
        await saveData(DB_KEYS.FIXTURES, fixtures);
        
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
    async checkFixtureCongestion(playerId) {
        const fixtures = await getData(DB_KEYS.FIXTURES);
        const playerFixtures = fixtures.filter(f => 
            (f.home_player_id === playerId || f.away_player_id === playerId) && !f.played
        );
        
        // Check next 7 days
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        const upcomingFixtures = playerFixtures.filter(f => {
            const fixtureDate = new Date(f.date);
            return fixtureDate <= nextWeek;
        });

        return {
            hasCongestion: upcomingFixtures.length > this.maxMatchesPerWeek,
            matchesInNextWeek: upcomingFixtures.length,
            recommendation: upcomingFixtures.length > this.maxMatchesPerWeek ? 
                'Consider rescheduling some matches' : 'Schedule looks good'
        };
    }

    // Check home/away balance
    async checkHomeAwayBalance(playerId) {
        const fixtures = await getData(DB_KEYS.FIXTURES);
        const playerFixtures = fixtures.filter(f => 
            f.home_player_id === playerId || f.away_player_id === playerId
        );
        
        const homeMatches = playerFixtures.filter(f => f.home_player_id === playerId).length;
        const awayMatches = playerFixtures.filter(f => f.away_player_id === playerId).length;
        
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
    async detectDateConflicts(fixtures = null) {
        const fixturesToCheck = fixtures || await getData(DB_KEYS.FIXTURES);
        const conflicts = [];
        const dateMap = new Map();

        fixturesToCheck.forEach(fixture => {
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
                [fixture.home_player_id, fixture.away_player_id].forEach(playerId => {
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

    // Get next available fixture ID
    async getNextFixtureId() {
        const fixtures = await getData(DB_KEYS.FIXTURES);
        return fixtures.length > 0 ? Math.max(...fixtures.map(f => f.id || 0)) + 1 : 1;
    }

    // Generate fixture report
    async generateFixtureReport() {
        const fixtures = await getData(DB_KEYS.FIXTURES);
        const players = await getData(DB_KEYS.PLAYERS);
        const results = await getData(DB_KEYS.RESULTS);
        
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
            playerSchedules: await this.getPlayerSchedules(players, fixtures),
            conflicts: await this.detectDateConflicts(),
            recommendations: await this.getSchedulingRecommendations(players, fixtures),
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
        
        const venues = Object.keys(usage);
        return {
            total: usage,
            upcoming: upcomingUsage,
            mostUsed: venues.length > 0 ? venues.reduce((a, b) => usage[a] > usage[b] ? a : b) : 'None',
            leastUsed: venues.length > 0 ? venues.reduce((a, b) => usage[a] < usage[b] ? a : b) : 'None'
        };
    }

    async getPlayerSchedules(players, fixtures) {
        return await Promise.all(players.map(async (player) => {
            const playerFixtures = fixtures.filter(f => 
                f.home_player_id === player.id || f.away_player_id === player.id
            );
            
            const congestion = await this.checkFixtureCongestion(player.id);
            const balance = await this.checkHomeAwayBalance(player.id);
            
            return {
                playerId: player.id,
                playerName: player.name,
                totalMatches: playerFixtures.length,
                playedMatches: playerFixtures.filter(f => f.played).length,
                upcomingMatches: playerFixtures.filter(f => !f.played).length,
                homeMatches: playerFixtures.filter(f => f.home_player_id === player.id).length,
                awayMatches: playerFixtures.filter(f => f.away_player_id === player.id).length,
                congestion: congestion,
                balance: balance,
                nextMatch: this.getNextPlayerMatch(player.id, fixtures),
                lastMatch: this.getLastPlayerMatch(player.id, fixtures)
            };
        }));
    }

    getNextPlayerMatch(playerId, fixtures) {
        const upcoming = fixtures
            .filter(f => !f.played && (f.home_player_id === playerId || f.away_player_id === playerId))
            .sort((a, b) => new Date(a.date) - new Date(b.date));
        
        return upcoming.length > 0 ? upcoming[0] : null;
    }

    getLastPlayerMatch(playerId, fixtures) {
        const played = fixtures
            .filter(f => f.played && (f.home_player_id === playerId || f.away_player_id === playerId))
            .sort((a, b) => new Date(b.date) - new Date(a.date));
        
        return played.length > 0 ? played[0] : null;
    }

    async getSchedulingRecommendations(players, fixtures) {
        const recommendations = [];
        
        // Check each player's schedule
        for (const player of players) {
            const congestion = await this.checkFixtureCongestion(player.id);
            const balance = await this.checkHomeAwayBalance(player.id);
            
            if (congestion.hasCongestion) {
                recommendations.push({
                    type: 'CONGESTION',
                    player: player.name,
                    priority: 'HIGH',
                    matchesInWeek: congestion.matchesInNextWeek,
                    message: `${player.name} has ${congestion.matchesInNextWeek} matches in the next week - consider rescheduling`,
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
        }
        
        // Check venue usage
        const venueUsage = this.getVenueUsage(fixtures);
        const totalFixtures = fixtures.length;
        const venueCount = Object.keys(venueUsage.total).length;
        const expectedPerVenue = venueCount > 0 ? totalFixtures / venueCount : 0;
        
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
        const conflicts = await this.detectDateConflicts();
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
    async showFixtureReport() {
        const report = await this.generateFixtureReport();
        
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
                        <div class="card text-center bg-dark text-light">
                            <div class="card-body">
                                <h3 class="text-warning">${report.summary.totalFixtures}</h3>
                                <p class="mb-0">Total Fixtures</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-center bg-dark text-light">
                            <div class="card-body">
                                <h3 class="text-success">${report.summary.playedFixtures}</h3>
                                <p class="mb-0">Played</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-center bg-dark text-light">
                            <div class="card-body">
                                <h3 class="text-warning">${report.summary.upcomingFixtures}</h3>
                                <p class="mb-0">Upcoming</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-center bg-dark text-light">
                            <div class="card-body">
                                <h3 class="text-info">${Math.round(report.summary.completionPercentage)}%</h3>
                                <p class="mb-0">Completion</p>
                            </div>
                        </div>
                    </div>
                </div>

                ${report.recommendations.length > 0 ? `
                    <div class="card bg-dark text-light mb-4">
                        <div class="card-header bg-warning text-dark">
                            <h5 class="mb-0"><i class="fas fa-exclamation-triangle me-2"></i>Recommendations</h5>
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
                ` : '<div class="alert alert-success">No issues found! Schedule looks good.</div>'}

                <div class="card bg-dark text-light">
                    <div class="card-header bg-primary">
                        <h5 class="mb-0"><i class="fas fa-users me-2"></i>Player Schedule Analysis</h5>
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
                                                    ${player.congestion.matchesInNextWeek}/week
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
                    <div class="modal-content bg-dark text-light">
                        <div class="modal-header bg-primary">
                            <h5 class="modal-title">${title}</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            ${content}
                        </div>
                        <div class="modal-footer bg-secondary">
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

async function checkFixtureConflicts() {
    const conflicts = await fixtureManager.detectDateConflicts();
    
    if (conflicts.length === 0) {
        showNotification('✅ No scheduling conflicts found!', 'success');
    } else {
        let message = `Found ${conflicts.length} scheduling conflict(s):\n`;
        conflicts.forEach(conflict => {
            message += `• ${conflict.message}\n`;
        });
        
        // Show detailed modal instead of alert
        fixtureManager.showModal('Scheduling Conflicts', `
            <div class="alert alert-danger">
                <h5><i class="fas fa-exclamation-triangle me-2"></i>Found ${conflicts.length} Scheduling Conflicts</h5>
                <ul class="mb-0">
                    ${conflicts.map(conflict => `<li>${conflict.message}</li>`).join('')}
                </ul>
            </div>
            <p>Use the fixture report for detailed analysis and recommendations.</p>
        `);
    }
}

async function showRescheduleTool() {
    // Create a simple reschedule interface
    const fixtures = await getData(DB_KEYS.FIXTURES);
    const players = await getData(DB_KEYS.PLAYERS);
    
    const upcomingFixtures = fixtures.filter(f => !f.played);
    
    if (upcomingFixtures.length === 0) {
        showNotification('No upcoming fixtures to reschedule!', 'warning');
        return;
    }
    
    let fixtureOptions = upcomingFixtures.map(f => {
        const homePlayer = players.find(p => p.id === f.home_player_id);
        const awayPlayer = players.find(p => p.id === f.away_player_id);
        if (!homePlayer || !awayPlayer) return '';
        return `<option value="${f.id}">${homePlayer.name} vs ${awayPlayer.name} (${f.date} ${f.time})</option>`;
    }).filter(opt => opt).join('');
    
    fixtureManager.showModal('Reschedule Fixture', `
        <form id="reschedule-form">
            <div class="mb-3">
                <label class="form-label">Select Fixture to Reschedule:</label>
                <select class="form-select bg-dark text-light" id="reschedule-fixture-select">
                    ${fixtureOptions}
                </select>
            </div>
            <div class="row mb-3">
                <div class="col-md-6">
                    <label class="form-label">New Date:</label>
                    <input type="date" class="form-control bg-dark text-light" id="reschedule-date" value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div class="col-md-6">
                    <label class="form-label">New Time:</label>
                    <input type="time" class="form-control bg-dark text-light" id="reschedule-time" value="15:00">
                </div>
            </div>
            <div class="mb-3">
                <label class="form-label">New Venue:</label>
                <input type="text" class="form-control bg-dark text-light" id="reschedule-venue" value="Virtual Stadium A">
            </div>
            <button type="button" class="btn btn-primary w-100" onclick="performReschedule()">
                <i class="fas fa-calendar-alt me-2"></i> Reschedule Fixture
            </button>
        </form>
    `);
}

async function performReschedule() {
    const fixtureId = parseInt(document.getElementById('reschedule-fixture-select').value);
    const newDate = document.getElementById('reschedule-date').value;
    const newTime = document.getElementById('reschedule-time').value;
    const newVenue = document.getElementById('reschedule-venue').value;
    
    if (!fixtureId || !newDate || !newTime || !newVenue) {
        showNotification('Please fill in all fields!', 'error');
        return;
    }
    
    const fixtures = await getData(DB_KEYS.FIXTURES);
    const fixtureIndex = fixtures.findIndex(f => f.id === fixtureId);
    
    if (fixtureIndex === -1) {
        showNotification('Fixture not found!', 'error');
        return;
    }
    
    // Check for conflicts
    const tempFixtures = [...fixtures];
    tempFixtures[fixtureIndex] = {
        ...tempFixtures[fixtureIndex],
        date: newDate,
        time: newTime,
        venue: newVenue
    };
    
    const conflicts = await fixtureManager.detectDateConflicts(tempFixtures);
    const relevantConflicts = conflicts.filter(conflict => 
        conflict.date === newDate && 
        (conflict.fixtures.includes(fixtureId))
    );
    
    if (relevantConflicts.length > 0) {
        showNotification('Schedule conflict detected! Please choose different date/time.', 'error');
        return;
    }
    
    // Apply changes
    fixtures[fixtureIndex].date = newDate;
    fixtures[fixtureIndex].time = newTime;
    fixtures[fixtureIndex].venue = newVenue;
    fixtures[fixtureIndex].updated_at = new Date().toISOString();
    
    await saveData(DB_KEYS.FIXTURES, fixtures);
    
    // Update MongoDB if available
    if (typeof eflAPI !== 'undefined' && eflAPI.isOnline) {
        eflAPI.updateFixture(fixtureId, fixtures[fixtureIndex]);
    }
    
    showNotification('Fixture rescheduled successfully!', 'success');
    renderAdminFixtures();
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('fixtureReportModal'));
    if (modal) modal.hide();
    }
