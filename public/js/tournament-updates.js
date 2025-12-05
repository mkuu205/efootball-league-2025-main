// Tournament Updates and News System
import { getData, DB_KEYS, getSupabase } from './database.js'; // ✅ ADD getSupabase if needed

export class TournamentUpdates {
    constructor() {
        this.updates = [];
        this.init();
    }

    init() {
        console.log('Tournament Updates initialized');
        this.loadUpdates();
    }

    async loadUpdates() {
        try {
            // Use a valid table name - either add TOURNAMENT_UPDATES to DB_KEYS or use existing table
            const updatesTable = window.DB_KEYS?.TOURNAMENT_UPDATES || 'results'; // Fallback to results table for now
            this.updates = await getData(updatesTable) || [];
            console.log('Loaded updates:', this.updates.length);
        } catch (error) {
            console.error('Error loading updates:', error);
            this.updates = [];
        }
    }

    async loadUpdatesDashboard() {
        const container = document.getElementById('tournament-updates-container');
        if (!container) return;

        await this.loadUpdates();
        container.innerHTML = this.generateUpdatesHTML();
    }

    generateUpdatesHTML() {
        return `
            <div class="text-center mb-5">
                <h1 class="text-warning"><i class="fas fa-newspaper me-3"></i>Tournament Updates</h1>
                <p class="text-muted">Latest news, announcements, and match highlights</p>
            </div>

            <div class="row">
                <div class="col-md-8">
                    <!-- Updates Feed -->
                    <div class="stat-card mb-4">
                        <h4 class="text-warning mb-4">
                            <i class="fas fa-bullhorn me-2"></i>Latest News & Announcements
                        </h4>
                        <div id="updates-feed">
                            ${this.generateUpdatesFeed()}
                        </div>
                    </div>

                    <!-- Match Highlights -->
                    <div class="stat-card">
                        <h4 class="text-warning mb-4">
                            <i class="fas fa-star me-2"></i>Recent Match Highlights
                        </h4>
                        <div id="match-highlights">
                            ${this.generateMatchHighlights()}
                        </div>
                    </div>
                </div>

                <div class="col-md-4">
                    <!-- Quick Stats -->
                    <div class="stat-card mb-4">
                        <h5 class="text-info mb-3">
                            <i class="fas fa-chart-pie me-2"></i>Tournament Snapshot
                        </h5>
                        <div id="tournament-snapshot">
                            ${this.generateTournamentSnapshot()}
                        </div>
                    </div>

                    <!-- Upcoming Events -->
                    <div class="stat-card">
                        <h5 class="text-info mb-3">
                            <i class="fas fa-calendar-day me-2"></i>Upcoming Events
                        </h5>
                        <div id="upcoming-events">
                            ${this.generateUpcomingEvents()}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    generateUpdatesFeed() {
        if (this.updates.length === 0) {
            return `
                <div class="text-center text-muted p-5">
                    <i class="fas fa-newspaper fa-3x mb-3"></i>
                    <p>No updates yet. Check back later for tournament news!</p>
                </div>
            `;
        }

        const sortedUpdates = [...this.updates].sort((a, b) => 
            new Date(b.created_at || b.date) - new Date(a.created_at || a.date)
        );

        return sortedUpdates.map(update => `
            <div class="update-item mb-4 p-3 rounded" style="background: rgba(255,255,255,0.05);">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <h6 class="text-warning mb-0">${update.title}</h6>
                    <small class="text-muted">${this.formatUpdateDate(update.created_at || update.date)}</small>
                </div>
                <p class="mb-2">${update.content}</p>
                ${update.author ? `<small class="text-muted">By ${update.author}</small>` : ''}
                ${update.type ? `<span class="badge bg-primary ms-2">${update.type}</span>` : ''}
            </div>
        `).join('');
    }

    generateMatchHighlights() {
        return `
            <div class="text-center text-muted p-4">
                <i class="fas fa-futbol fa-2x mb-3"></i>
                <p>Match highlights will appear here after exciting games!</p>
                <small>High-scoring matches, close contests, and upsets will be featured.</small>
            </div>
        `;
    }

    generateTournamentSnapshot() {
        return `
            <div class="list-group list-group-flush bg-transparent">
                <div class="list-group-item bg-transparent text-light d-flex justify-content-between align-items-center">
                    <span>🏆 Current Leader</span>
                    <span class="text-warning">To be determined</span>
                </div>
                <div class="list-group-item bg-transparent text-light d-flex justify-content-between align-items-center">
                    <span>⚽ Total Goals</span>
                    <span class="text-info">0</span>
                </div>
                <div class="list-group-item bg-transparent text-light d-flex justify-content-between align-items-center">
                    <span>📊 Matches Played</span>
                    <span class="text-success">0</span>
                </div>
                <div class="list-group-item bg-transparent text-light d-flex justify-content-between align-items-center">
                    <span>🎯 Avg Goals/Match</span>
                    <span class="text-primary">0.0</span>
                </div>
            </div>
        `;
    }

    generateUpcomingEvents() {
        return `
            <div class="text-center text-muted p-3">
                <i class="fas fa-calendar fa-2x mb-3"></i>
                <p>Upcoming events will be listed here</p>
                <small>Important matches, deadlines, and announcements</small>
            </div>
        `;
    }

    formatUpdateDate(dateString) {
        if (!dateString) return 'Recently';
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffTime = Math.abs(now - date);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) return 'Yesterday';
            if (diffDays < 7) return `${diffDays} days ago`;
            if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
            
            return date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
        } catch (error) {
            return 'Recently';
        }
    }
}

// Initialize tournament updates
export const tournamentUpdates = new TournamentUpdates();
