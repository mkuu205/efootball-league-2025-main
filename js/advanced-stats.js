// Advanced Statistics System
class AdvancedStatistics {
    constructor() {
        this.playerMetrics = new Map();
        this.teamAnalytics = new Map();
        this.init();
    }

    init() {
        console.log('Advanced Statistics initialized');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for tab changes to load advanced stats
        document.addEventListener('DOMContentLoaded', () => {
            const advancedStatsTab = document.querySelector('[data-tab="advanced-stats"]');
            if (advancedStatsTab) {
                advancedStatsTab.addEventListener('click', () => {
                    setTimeout(() => {
                        this.loadAdvancedStatsDashboard();
                    }, 100);
                });
            }
        });
    }

    // Load the advanced statistics dashboard
    loadAdvancedStatsDashboard() {
        const container = document.getElementById('advanced-stats-container');
        if (!container) return;

        container.innerHTML = this.generateDashboardHTML();
        this.populatePlayerStats();
        this.setupComparisonTool();
    }

    generateDashboardHTML() {
        return `
            <div class="text-center mb-5">
                <h1 class="text-warning"><i class="fas fa-chart-line me-3"></i>Advanced Statistics</h1>
                <p class="text-muted">Deep insights into player and team performance</p>
            </div>

            <!-- Player Performance Analysis -->
            <div class="row mb-4">
                <div class="col-12">
                    <div class="stat-card">
                        <h4 class="text-warning mb-4">
                            <i class="fas fa-user me-2"></i>Player Performance Analysis
                        </h4>
                        <div class="row mb-4">
                            <div class="col-md-6">
                                <label class="form-label">Select Player</label>
                                <select class="form-select bg-dark text-light" id="player-select">
                                    <option value="">Choose a player...</option>
                                </select>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Compare With</label>
                                <select class="form-select bg-dark text-light" id="compare-player-select">
                                    <option value="">Select player to compare...</option>
                                </select>
                            </div>
                        </div>
                        <div id="player-stats-container">
                            <div class="text-center text-muted p-5">
                                <i class="fas fa-user fa-3x mb-3"></i>
                                <p>Select a player to view detailed statistics</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Player Comparison -->
            <div class="row mb-4">
                <div class="col-12">
                    <div class="stat-card">
                        <h4 class="text-warning mb-4">
                            <i class="fas fa-users me-2"></i>Player Comparison
                        </h4>
                        <div id="player-comparison-container">
                            <div class="text-center text-muted p-5">
                                <i class="fas fa-users fa-3x mb-3"></i>
                                <p>Select two players to compare their performance</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Team Performance -->
            <div class="row">
                <div class="col-md-6">
                    <div class="stat-card">
                        <h5 class="text-info mb-3">
                            <i class="fas fa-shield-alt me-2"></i>Team Performance
                        </h5>
                        <div id="team-stats-container">
                            <!-- Team stats will be loaded here -->
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="stat-card">
                        <h5 class="text-info mb-3">
                            <i class="fas fa-trophy me-2"></i>Tournament Leaders
                        </h5>
                        <div id="tournament-leaders-container">
                            <!-- Tournament leaders will be loaded here -->
                        </div>
                    </div>
                </div>
            </div>

            <!-- Advanced Metrics -->
            <div class="row mt-4">
                <div class="col-12">
                    <div class="stat-card">
                        <h4 class="text-warning mb-4">
                            <i class="fas fa-chart-bar me-2"></i>Advanced Metrics
                        </h4>
                        <div class="row" id="advanced-metrics-container">
                            <!-- Advanced metrics will be loaded here -->
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Populate player select dropdowns
    populatePlayerSelects() {
        const players = getData('players') || [];
        const playerSelect = document.getElementById('player-select');
        const compareSelect = document.getElementById('compare-player-select');

        if (!playerSelect || !compareSelect) {
            console.error('Player select elements not found');
            return;
        }

        playerSelect.innerHTML = '<option value="">Choose a player...</option>';
        compareSelect.innerHTML = '<option value="">Select player to compare...</option>';

        const uniquePlayers = [];
        const seenPlayerIds = new Set();

        players.forEach(player => {
            if (player && !seenPlayerIds.has(player.id)) {
                seenPlayerIds.add(player.id);
                uniquePlayers.push(player);
            }
        });

        uniquePlayers.forEach(player => {
            const option1 = document.createElement('option');
            option1.value = player.id;
            option1.textContent = `${player.name} (${player.team})`;
            playerSelect.appendChild(option1);

            const option2 = document.createElement('option');
            option2.value = player.id;
            option2.textContent = `${player.name} (${player.team})`;
            compareSelect.appendChild(option2);
        });

        playerSelect.addEventListener('change', (e) => {
            const playerId = parseInt(e.target.value);
            this.loadPlayerStats(playerId);
            this.updateComparison();
        });

        compareSelect.addEventListener('change', () => {
            this.updateComparison();
        });
    }

    // Load player statistics
    loadPlayerStats(playerId) {
        const container = document.getElementById('player-stats-container');
        if (!playerId) {
            container.innerHTML = `
                <div class="text-center text-muted p-4">
                    <i class="fas fa-user fa-2x mb-2"></i>
                    <p>Select a player to view detailed statistics</p>
                </div>
            `;
            return;
        }

        const player = this.getPlayerDataSafe(playerId);
        const stats = this.analyzePlayerPerformance(playerId);

        container.innerHTML = this.generatePlayerStatsHTML(player, stats);
    }

    getPlayerById(playerId) {
        const players = getData('players') || [];
        return players.find(p => p && p.id === playerId);
    }

    getPlayerDataSafe(playerId) {
        const player = this.getPlayerById(playerId);
        if (!player) {
            return {
                id: playerId,
                name: 'Unknown Player',
                team: 'Unknown Team',
                strength: 0,
                photo: 'default-photo.jpg',
                defaultPhoto: 'default-photo.jpg'
            };
        }
        return player;
    }

    analyzePlayerPerformance(playerId) {
        const results = getData('results') || [];
        const playerResults = results.filter(r =>
            r && (r.homePlayerId === playerId || r.awayPlayerId === playerId)
        );

        const basicStats = this.getBasicStats(playerResults, playerId);
        const formAnalysis = this.analyzeForm(playerResults, playerId);
        const strengthAnalysis = this.analyzeStrengthProgression(playerId);
        const predictiveAnalytics = this.predictFuturePerformance(playerId, basicStats, formAnalysis);

        return { basicStats, formAnalysis, strengthAnalysis, predictiveAnalytics };
    }

    getBasicStats(results, playerId) {
        let stats = {
            matches: results.length,
            wins: 0, draws: 0, losses: 0,
            goalsFor: 0, goalsAgainst: 0,
            homeRecord: { wins: 0, draws: 0, losses: 0 },
            awayRecord: { wins: 0, draws: 0, losses: 0 },
            cleanSheets: 0,
            avgGoalsPerMatch: 0,
            winPercentage: 0
        };

        results.forEach(result => {
            const isHome = result.homePlayerId === playerId;
            const playerScore = isHome ? result.homeScore : result.awayScore;
            const opponentScore = isHome ? result.awayScore : result.homeScore;

            if (playerScore > opponentScore) {
                stats.wins++;
                if (isHome) stats.homeRecord.wins++;
                else stats.awayRecord.wins++;
            } else if (playerScore === opponentScore) {
                stats.draws++;
                if (isHome) stats.homeRecord.draws++;
                else stats.awayRecord.draws++;
            } else {
                stats.losses++;
                if (isHome) stats.homeRecord.losses++;
                else stats.awayRecord.losses++;
            }

            stats.goalsFor += playerScore;
            stats.goalsAgainst += opponentScore;

            if (opponentScore === 0) stats.cleanSheets++;
        });

        stats.avgGoalsPerMatch = (stats.matches ? (stats.goalsFor / stats.matches) : 0).toFixed(1);
        stats.winPercentage = (stats.matches ? ((stats.wins / stats.matches) * 100) : 0).toFixed(1);

        const totalHome = stats.homeRecord.wins + stats.homeRecord.draws + stats.homeRecord.losses;
        const totalAway = stats.awayRecord.wins + stats.awayRecord.draws + stats.awayRecord.losses;

        stats.homeWinRate = totalHome ? ((stats.homeRecord.wins / totalHome) * 100).toFixed(1) : 0;
        stats.awayWinRate = totalAway ? ((stats.awayRecord.wins / totalAway) * 100).toFixed(1) : 0;

        return stats;
    }

    analyzeForm(results, playerId) {
        const last5 = results.slice(-5).reverse();
        const form = last5.map(result => {
            const isHome = result.homePlayerId === playerId;
            const playerScore = isHome ? result.homeScore : result.awayScore;
            const opponentScore = isHome ? result.awayScore : result.homeScore;
            if (playerScore > opponentScore) return 'W';
            if (playerScore === opponentScore) return 'D';
            return 'L';
        });

        const pointsPerGame = last5.reduce((acc, result) => {
            const isHome = result.homePlayerId === playerId;
            const playerScore = isHome ? result.homeScore : result.awayScore;
            const opponentScore = isHome ? result.awayScore : result.homeScore;
            if (playerScore > opponentScore) return acc + 3;
            if (playerScore === opponentScore) return acc + 1;
            return acc;
        }, 0) / (last5.length || 1);

        return {
            recentForm: form,
            currentStreak: this.calculateStreak(form),
            pointsPerGame: pointsPerGame.toFixed(2),
            formRating: this.calculateFormRating(form)
        };
    }

    calculateStreak(form) {
        if (!form.length) return { type: 'none', length: 0 };
        let type = form[0], length = 1;
        for (let i = 1; i < form.length; i++) {
            if (form[i] === type) length++;
            else break;
        }
        return { type, length };
    }

    calculateFormRating(form) {
        if (!form.length) return 0;
        const weights = { 'W': 1, 'D': 0.5, 'L': 0 };
        const rating = form.reduce((acc, r) => acc + weights[r], 0) / form.length;
        return Math.round(rating * 100);
    }

    generatePlayerStatsHTML(player, stats) {
        const playerData = this.getPlayerDataSafe(player.id);
        const formBadges = (stats.formAnalysis.recentForm || []).map(result => {
            const badgeClass = result === 'W' ? 'bg-success' : result === 'D' ? 'bg-warning' : 'bg-danger';
            return `<span class="badge ${badgeClass} me-1">${result}</span>`;
        }).join('') || '<span class="text-muted">No matches</span>';

        return `
            <div class="row">
                <div class="col-md-3 text-center">
                    <img src="${playerData.photo}" class="rounded-circle mb-3" style="width:100px;height:100px;object-fit:cover;"
                         onerror="this.src='${playerData.defaultPhoto || playerData.photo}'">
                    <h5 class="text-warning">${playerData.name}</h5>
                    <span class="badge bg-info">${playerData.team}</span>
                </div>
                <div class="col-md-9">
                    <div class="row mb-3">
                        <div class="col-md-4">
                            <p><strong>Matches:</strong> ${stats.basicStats.matches}</p>
                            <p><strong>Wins:</strong> ${stats.basicStats.wins}</p>
                            <p><strong>Draws:</strong> ${stats.basicStats.draws}</p>
                            <p><strong>Losses:</strong> ${stats.basicStats.losses}</p>
                        </div>
                        <div class="col-md-4">
                            <p><strong>Goals For:</strong> ${stats.basicStats.goalsFor}</p>
                            <p><strong>Goals Against:</strong> ${stats.basicStats.goalsAgainst}</p>
                            <p><strong>Clean Sheets:</strong> ${stats.basicStats.cleanSheets}</p>
                            <p><strong>Avg Goals:</strong> ${stats.basicStats.avgGoalsPerMatch}</p>
                        </div>
                        <div class="col-md-4">
                            <p><strong>Win %:</strong> ${stats.basicStats.winPercentage}%</p>
                            <p><strong>Home Win %:</strong> ${stats.basicStats.homeWinRate}%</p>
                            <p><strong>Away Win %:</strong> ${stats.basicStats.awayWinRate}%</p>
                        </div>
                    </div>
                    <div class="mb-2"><strong>Recent Form:</strong> ${formBadges}</div>
                    <div><strong>Form Rating:</strong> ${stats.formAnalysis.formRating}</div>
                </div>
            </div>
        `;
    }

    // Predictive Analytics
    predictFuturePerformance(playerId, basicStats, formAnalysis) {
        const strengthAnalysis = this.analyzeStrengthProgression(playerId);
        const expectedGoals = (basicStats.avgGoalsPerMatch || 0) * 1.1;
        const winProbability = (basicStats.winPercentage || 0) * 1.05;

        return {
            expectedGoals: expectedGoals.toFixed(1),
            predictedWinRate: winProbability.toFixed(1),
            recommendedStrategy: this.generateStrategyRecommendation(basicStats)
        };
    }

    generateStrategyRecommendation(stats = { goalsFor: 0, goalsAgainst: 0 }) {
        if ((stats.goalsFor || 0) > (stats.goalsAgainst || 0) * 1.5) return "Maintain attacking strategy";
        if ((stats.goalsAgainst || 0) > (stats.goalsFor || 0)) return "Focus on defensive organization";
        return "Balanced approach recommended";
    }

    analyzeStrengthProgression(playerId) {
        const player = this.getPlayerDataSafe(playerId);
        const progression = (player.strength || 0) / 10; // simple example
        return {
            currentStrength: player.strength || 0,
            projectedStrength: Math.min(player.strength + progression, 100).toFixed(1)
        };
    }

    updateComparison() {
        const player1Id = parseInt(document.getElementById('player-select')?.value);
        const player2Id = parseInt(document.getElementById('compare-player-select')?.value);
        if (!player1Id || !player2Id) return;

        const player1 = this.analyzePlayerPerformance(player1Id);
        const player2 = this.analyzePlayerPerformance(player2Id);

        const container = document.getElementById('player-comparison-container');
        if (!container) return;

        container.innerHTML = `
            <div class="row">
                <div class="col-md-6">${this.generatePlayerStatsHTML(this.getPlayerById(player1Id), player1)}</div>
                <div class="col-md-6">${this.generatePlayerStatsHTML(this.getPlayerById(player2Id), player2)}</div>
            </div>
        `;
    }

    setupComparisonTool() {
        this.populatePlayerSelects();
    }
}

// Initialize AdvancedStatistics
const advancedStats = new AdvancedStatistics();
