// Tournament Updates and Notifications System
class TournamentUpdates {
    constructor() {
        this.updateTypes = {
            MATCH_RESULT: 'match_result',
            FIXTURE_CHANGE: 'fixture_change',
            PLAYER_UPDATE: 'player_update',
            TOURNAMENT_PHASE: 'tournament_phase',
            GENERAL_ANNOUNCEMENT: 'announcement'
        };
        
        this.updates = [];
        this.notificationManager = new PushNotificationManager();
        this.init();
    }

    init() {
        console.log('Tournament Updates initialized');
        this.loadUpdatesFromStorage();
        this.setupEventListeners();
        
        // Start monitoring for changes
        this.startChangeMonitoring();
    }

    setupEventListeners() {
        // Listen for tab changes to load updates
        document.addEventListener('DOMContentLoaded', () => {
            const updatesTab = document.querySelector('[data-tab="updates"]');
            if (updatesTab) {
                updatesTab.addEventListener('click', () => {
                    this.loadUpdatesDashboard();
                });
            }
        });

        // Setup admin notification form if on admin page
        if (window.location.pathname.includes('admin.html')) {
            this.setupAdminNotificationForm();
        }
    }

    // Load updates from localStorage
    loadUpdatesFromStorage() {
        const storedUpdates = localStorage.getItem('efl_tournament_updates');
        if (storedUpdates) {
            this.updates = JSON.parse(storedUpdates);
        }
    }

    // Save updates to localStorage
    saveUpdatesToStorage() {
        localStorage.setItem('efl_tournament_updates', JSON.stringify(this.updates));
    }

    // Create and manage updates
    createUpdate(type, data, priority = 'normal') {
        const update = {
            id: this.generateUpdateId(),
            type: type,
            data: data,
            priority: priority,
            timestamp: new Date(),
            read: false,
            expires: this.calculateExpiry(type)
        };

        this.updates.unshift(update); // Add to beginning
        this.saveUpdatesToStorage();
        
        // Display update in UI
        this.displayUpdate(update);
        
        // Send push notification
        this.notificationManager.sendUpdateNotification(update);
        
        return update;
    }

    generateUpdateId() {
        return 'update_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    calculateExpiry(type) {
        const now = new Date();
        switch (type) {
            case this.updateTypes.MATCH_RESULT:
                return new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days
            case this.updateTypes.FIXTURE_CHANGE:
                return new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000)); // 3 days
            case this.updateTypes.TOURNAMENT_PHASE:
                return new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days
            default:
                return new Date(now.getTime() + (24 * 60 * 60 * 1000)); // 24 hours
        }
    }

    // ADMIN NOTIFICATION METHODS
    // Setup admin notification form
    setupAdminNotificationForm() {
        const form = document.getElementById('push-notification-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAdminNotificationSubmit();
            });
        }
        
        this.loadNotificationHistoryDisplay();
    }

    handleAdminNotificationSubmit() {
        const title = document.getElementById('notification-title').value;
        const message = document.getElementById('notification-message').value;
        const type = document.getElementById('notification-type').value;
        const targetAll = document.getElementById('target-all').checked;
        const targetPlayers = document.getElementById('target-players').checked;
        
        let target = 'all';
        if (targetPlayers && !targetAll) {
            target = 'players';
        }
        
        if (!title || !message) {
            showNotification('Please fill in all fields!', 'error');
            return;
        }
        
        this.sendAdminPushNotification(title, message, type, target);
        
        // Reset form
        document.getElementById('push-notification-form').reset();
        showNotification('Notification sent successfully!', 'success');
    }

    sendAdminPushNotification(title, message, type = 'info', target = 'all') {
        // Create the update
        const update = this.createUpdate(
            this.updateTypes.GENERAL_ANNOUNCEMENT,
            {
                title: title,
                message: message,
                isAdminPush: true,
                notificationType: type,
                target: target
            },
            type === 'urgent' ? 'high' : 'medium'
        );

        // Send push notification to all users
        if (this.notificationManager.notificationPermission === 'granted') {
            this.notificationManager.sendCustomNotification(title, message, {
                icon: this.getNotificationIcon(type),
                tag: `admin-push-${Date.now()}`,
                requireInteraction: true
            });
        }

        // Store in notification history
        this.saveNotificationToHistory({
            id: update.id,
            title: title,
            message: message,
            type: type,
            target: target,
            timestamp: new Date(),
            sentBy: 'admin'
        });

        return update;
    }

    getNotificationIcon(type) {
        switch (type) {
            case 'warning': return '/icons/warning.png';
            case 'success': return '/icons/success.png';
            case 'urgent': return '/icons/urgent.png';
            default: return '/icons/info.png';
        }
    }

    saveNotificationToHistory(notification) {
        const history = JSON.parse(localStorage.getItem('efl_notification_history') || '[]');
        history.unshift(notification);
        
        // Keep only last 50 notifications
        if (history.length > 50) {
            history.pop();
        }
        
        localStorage.setItem('efl_notification_history', JSON.stringify(history));
    }

    loadNotificationHistory() {
        return JSON.parse(localStorage.getItem('efl_notification_history') || '[]');
    }

    loadNotificationHistoryDisplay() {
        const container = document.getElementById('notification-history');
        if (!container) return;
        
        const history = this.loadNotificationHistory();
        
        if (history.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">No notifications sent yet</p>';
            return;
        }
        
        container.innerHTML = history.map(notification => `
            <div class="notification-history-item mb-3 p-3 rounded" style="background: rgba(255,255,255,0.05);">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <div class="d-flex align-items-center mb-2">
                            <span class="badge ${this.getNotificationTypeBadge(notification.type)} me-2">
                                ${notification.type.toUpperCase()}
                            </span>
                            <strong>${notification.title}</strong>
                        </div>
                        <p class="mb-1">${notification.message}</p>
                        <small class="text-muted">
                            <i class="fas fa-clock me-1"></i>
                            ${new Date(notification.timestamp).toLocaleString()}
                            • Target: ${notification.target}
                        </small>
                    </div>
                    <button class="btn btn-sm btn-outline-light ms-2" 
                            onclick="tournamentUpdates.resendNotification('${notification.id}')"
                            title="Resend notification">
                        <i class="fas fa-redo"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    getNotificationTypeBadge(type) {
        switch (type) {
            case 'warning': return 'bg-warning';
            case 'success': return 'bg-success';
            case 'urgent': return 'bg-danger';
            default: return 'bg-info';
        }
    }

    resendNotification(notificationId) {
        const history = this.loadNotificationHistory();
        const notification = history.find(n => n.id === notificationId);
        
        if (notification) {
            this.sendAdminPushNotification(
                notification.title,
                notification.message,
                notification.type,
                notification.target
            );
            showNotification('Notification resent!', 'success');
        }
    }

    // Match result updates
    createMatchResultUpdate(result) {
        const homePlayer = getPlayerById(result.homePlayerId);
        const awayPlayer = getPlayerById(result.awayPlayerId);

        return this.createUpdate(
            this.updateTypes.MATCH_RESULT,
            {
                title: 'Match Result',
                message: `${homePlayer.name} ${result.homeScore}-${result.awayScore} ${awayPlayer.name}`,
                matchId: result.id,
                players: [homePlayer, awayPlayer],
                scores: [result.homeScore, result.awayScore],
                venue: this.getMatchVenue(result)
            },
            'high'
        );
    }

    getMatchVenue(result) {
        const fixtures = getData(DB_KEYS.FIXTURES);
        const fixture = fixtures.find(f => 
            f.homePlayerId === result.homePlayerId && 
            f.awayPlayerId === result.awayPlayerId
        );
        return fixture ? fixture.venue : 'Unknown Venue';
    }

    // Fixture change updates
    createFixtureChangeUpdate(oldFixture, newFixture) {
        const homePlayer = getPlayerById(newFixture.homePlayerId);
        const awayPlayer = getPlayerById(newFixture.awayPlayerId);

        return this.createUpdate(
            this.updateTypes.FIXTURE_CHANGE,
            {
                title: 'Fixture Updated',
                message: `${homePlayer.name} vs ${awayPlayer.name} rescheduled`,
                oldDate: oldFixture.date,
                newDate: newFixture.date,
                oldTime: oldFixture.time,
                newTime: newFixture.time,
                fixtureId: newFixture.id,
                players: [homePlayer, awayPlayer]
            },
            'medium'
        );
    }

    // Player update notifications
    createPlayerUpdateUpdate(player, oldData, newData) {
        let message = '';
        
        if (oldData.strength !== newData.strength) {
            message = `Strength rating changed from ${oldData.strength} to ${newData.strength}`;
        } else if (oldData.team !== newData.team) {
            message = `Team changed from ${oldData.team} to ${newData.team}`;
        } else {
            message = 'Player information updated';
        }

        return this.createUpdate(
            this.updateTypes.PLAYER_UPDATE,
            {
                title: 'Player Update',
                message: `${player.name}: ${message}`,
                playerId: player.id,
                changes: { old: oldData, new: newData }
            },
            'low'
        );
    }

    // Tournament phase updates
    createPhaseUpdate(oldPhase, newPhase) {
        return this.createUpdate(
            this.updateTypes.TOURNAMENT_PHASE,
            {
                title: 'Tournament Phase Update',
                message: `Tournament has moved from ${oldPhase} to ${newPhase} stage`,
                oldPhase: oldPhase,
                newPhase: newPhase
            },
            'high'
        );
    }

    // General announcements
    createAnnouncement(title, message, priority = 'medium') {
        return this.createUpdate(
            this.updateTypes.GENERAL_ANNOUNCEMENT,
            {
                title: title,
                message: message
            },
            priority
        );
    }

    // Load updates dashboard
    loadUpdatesDashboard() {
        const container = document.getElementById('tournament-updates-container');
        if (!container) return;

        container.innerHTML = this.generateDashboardHTML();
        this.displayAllUpdates();
        this.setupUpdatePreferences();
    }

    generateDashboardHTML() {
        const unreadCount = this.updates.filter(update => !update.read).length;

        return `
            <div class="text-center mb-5">
                <h1 class="text-warning"><i class="fas fa-bullhorn me-3"></i>Tournament Updates</h1>
                <p class="text-muted">Stay informed with real-time tournament information</p>
                ${unreadCount > 0 ? `
                    <span class="badge bg-danger fs-6">
                        <i class="fas fa-bell me-1"></i>${unreadCount} unread
                    </span>
                ` : ''}
            </div>

            <div class="row">
                <!-- Live Updates Feed -->
                <div class="col-md-8">
                    <div class="update-card">
                        <div class="d-flex justify-content-between align-items-center mb-4">
                            <h3 class="text-warning mb-0">
                                <i class="fas fa-rss me-2"></i>Live Updates Feed
                            </h3>
                            <div>
                                <button class="btn btn-sm btn-outline-info me-2" onclick="tournamentUpdates.markAllAsRead()">
                                    <i class="fas fa-check-double me-1"></i>Mark All Read
                                </button>
                                <button class="btn btn-sm btn-outline-warning" onclick="tournamentUpdates.showUpdateHistory()">
                                    <i class="fas fa-history me-1"></i>History
                                </button>
                            </div>
                        </div>
                        
                        <div id="updates-feed">
                            <!-- Updates will be dynamically loaded here -->
                        </div>

                        ${this.updates.length === 0 ? `
                            <div class="text-center text-muted p-5">
                                <i class="fas fa-bell-slash fa-3x mb-3"></i>
                                <h5>No updates yet</h5>
                                <p>Tournament updates will appear here as they happen</p>
                            </div>
                        ` : ''}
                    </div>

                    <!-- Create Announcement (Admin only) -->
                    ${this.isAdmin() ? `
                        <div class="update-card">
                            <h4 class="text-warning mb-4">
                                <i class="fas fa-edit me-2"></i>Create Announcement
                            </h4>
                            <form id="announcement-form">
                                <div class="mb-3">
                                    <label class="form-label">Title</label>
                                    <input type="text" class="form-control bg-dark text-light" 
                                           id="announcement-title" placeholder="Enter announcement title" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Message</label>
                                    <textarea class="form-control bg-dark text-light" 
                                              id="announcement-message" 
                                              rows="3" 
                                              placeholder="Enter announcement message" 
                                              required></textarea>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Priority</label>
                                    <select class="form-select bg-dark text-light" id="announcement-priority">
                                        <option value="low">Low</option>
                                        <option value="medium" selected>Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                                <button type="submit" class="btn btn-primary">
                                    <i class="fas fa-paper-plane me-1"></i>Publish Announcement
                                </button>
                            </form>
                        </div>
                    ` : ''}
                </div>

                <!-- Notification Settings & Stats -->
                <div class="col-md-4">
                    <!-- Notification Preferences -->
                    <div class="update-card">
                        <h4 class="text-warning mb-4">
                            <i class="fas fa-cog me-2"></i>Notification Settings
                        </h4>
                        
                        <div class="form-check form-switch mb-3">
                            <input class="form-check-input" type="checkbox" id="match-reminders" checked>
                            <label class="form-check-label" for="match-reminders">
                                Match Reminders
                            </label>
                        </div>
                        <div class="form-check form-switch mb-3">
                            <input class="form-check-input" type="checkbox" id="result-notifications" checked>
                            <label class="form-check-label" for="result-notifications">
                                Result Notifications
                            </label>
                        </div>
                        <div class="form-check form-switch mb-3">
                            <input class="form-check-input" type="checkbox" id="fixture-changes" checked>
                            <label class="form-check-label" for="fixture-changes">
                                Fixture Changes
                            </label>
                        </div>
                        <div class="form-check form-switch mb-3">
                            <input class="form-check-input" type="checkbox" id="tournament-updates">
                            <label class="form-check-label" for="tournament-updates">
                                Tournament Updates
                            </label>
                        </div>
                        <div class="form-check form-switch mb-3">
                            <input class="form-check-input" type="checkbox" id="push-notifications" checked>
                            <label class="form-check-label" for="push-notifications">
                                Push Notifications
                            </label>
                        </div>
                        
                        <button class="btn btn-primary w-100 mt-3" onclick="tournamentUpdates.savePreferences()">
                            <i class="fas fa-save me-1"></i>Save Preferences
                        </button>
                    </div>

                    <!-- Notification Statistics -->
                    <div class="update-card">
                        <h4 class="text-warning mb-4">
                            <i class="fas fa-chart-bar me-2"></i>Notification Stats
                        </h4>
                        
                        <div class="row text-center">
                            <div class="col-6 mb-3">
                                <div class="p-3 rounded" style="background: rgba(106, 17, 203, 0.2);">
                                    <div class="h4 text-warning mb-1" id="updates-today">0</div>
                                    <small>Sent Today</small>
                                </div>
                            </div>
                            <div class="col-6 mb-3">
                                <div class="p-3 rounded" style="background: rgba(37, 117, 252, 0.2);">
                                    <div class="h4 text-info mb-1" id="read-rate">0%</div>
                                    <small>Read Rate</small>
                                </div>
                            </div>
                            <div class="col-6 mb-3">
                                <div class="p-3 rounded" style="background: rgba(40, 167, 69, 0.2);">
                                    <div class="h4 text-success mb-1" id="updates-week">0</div>
                                    <small>This Week</small>
                                </div>
                            </div>
                            <div class="col-6 mb-3">
                                <div class="p-3 rounded" style="background: rgba(255, 193, 7, 0.2);">
                                    <div class="h4 text-warning mb-1" id="updates-pending">0</div>
                                    <small>Unread</small>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Quick Actions -->
                    <div class="update-card">
                        <h4 class="text-warning mb-4">
                            <i class="fas fa-bolt me-2"></i>Quick Actions
                        </h4>
                        
                        <button class="btn btn-outline-warning w-100 mb-2" onclick="tournamentUpdates.markAllAsRead()">
                            <i class="fas fa-check-double me-1"></i>Mark All Read
                        </button>
                        <button class="btn btn-outline-info w-100 mb-2" onclick="tournamentUpdates.showUpdateHistory()">
                            <i class="fas fa-history me-1"></i>View History
                        </button>
                        <button class="btn btn-outline-danger w-100" onclick="tournamentUpdates.clearAllUpdates()">
                            <i class="fas fa-trash me-1"></i>Clear All
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // Display all updates in the feed
    displayAllUpdates() {
        const feed = document.getElementById('updates-feed');
        if (!feed) return;

        if (this.updates.length === 0) {
            feed.innerHTML = `
                <div class="text-center text-muted p-5">
                    <i class="fas fa-bell-slash fa-3x mb-3"></i>
                    <h5>No updates yet</h5>
                    <p>Tournament updates will appear here as they happen</p>
                </div>
            `;
            return;
        }

        feed.innerHTML = this.updates.map(update => this.generateUpdateHTML(update)).join('');
        this.updateStatistics();
    }

    // Generate HTML for a single update
    generateUpdateHTML(update) {
        const priorityClass = this.getPriorityClass(update.priority);
        const icon = this.getUpdateIcon(update.type);
        const timeAgo = this.getTimeAgo(update.timestamp);
        const isReadClass = update.read ? 'opacity-75' : '';

        return `
            <div class="notification-item ${priorityClass} ${isReadClass}" data-update-id="${update.id}">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <span class="badge ${this.getPriorityBadgeClass(update.priority)} me-2">
                            ${update.priority.toUpperCase()}
                        </span>
                        <strong>${icon} ${update.data.title}</strong>
                        <p class="mb-1 mt-2">${update.data.message}</p>
                        <small class="text-muted">
                            <i class="fas fa-clock me-1"></i>${timeAgo}
                            ${update.data.venue ? ` • <i class="fas fa-map-marker-alt me-1"></i>${update.data.venue}` : ''}
                        </small>
                    </div>
                    <div class="ms-3">
                        ${!update.read ? `
                            <button class="btn btn-sm btn-outline-light mark-read" 
                                    onclick="tournamentUpdates.markAsRead('${update.id}')"
                                    title="Mark as read">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : `
                            <span class="badge bg-secondary" title="Read">
                                <i class="fas fa-check"></i>
                            </span>
                        `}
                    </div>
                </div>
            </div>
        `;
    }

    getPriorityClass(priority) {
        switch (priority) {
            case 'high': return 'notification-high';
            case 'medium': return 'notification-medium';
            case 'low': return 'notification-low';
            default: return 'notification-low';
        }
    }

    getPriorityBadgeClass(priority) {
        switch (priority) {
            case 'high': return 'bg-danger';
            case 'medium': return 'bg-warning';
            case 'low': return 'bg-info';
            default: return 'bg-secondary';
        }
    }

    getUpdateIcon(type) {
        switch (type) {
            case this.updateTypes.MATCH_RESULT: return '⚽';
            case this.updateTypes.FIXTURE_CHANGE: return '📅';
            case this.updateTypes.PLAYER_UPDATE: return '👤';
            case this.updateTypes.TOURNAMENT_PHASE: return '🏆';
            case this.updateTypes.GENERAL_ANNOUNCEMENT: return '📢';
            default: return '🔔';
        }
    }

    getTimeAgo(timestamp) {
        const now = new Date();
        const updateTime = new Date(timestamp);
        const diffMs = now - updateTime;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return updateTime.toLocaleDateString();
    }

    // Display a single update (for real-time updates)
    displayUpdate(update) {
        const feed = document.getElementById('updates-feed');
        if (!feed) return;

        // Remove the "no updates" message if it exists
        const noUpdatesMsg = feed.querySelector('.text-center.text-muted');
        if (noUpdatesMsg) {
            noUpdatesMsg.remove();
        }

        // Add the new update at the top
        const updateHTML = this.generateUpdateHTML(update);
        feed.insertAdjacentHTML('afterbegin', updateHTML);

        // Update statistics
        this.updateStatistics();

        // Show subtle notification
        this.showUpdateNotification(update);
    }

    showUpdateNotification(update) {
        // Create a temporary toast notification
        const notification = document.createElement('div');
        notification.className = `alert alert-${this.getPriorityAlertClass(update.priority)} alert-dismissible fade show position-fixed`;
        notification.style.cssText = `
            top: 80px;
            right: 20px;
            z-index: 1060;
            min-width: 300px;
            max-width: 400px;
        `;
        notification.innerHTML = `
            <strong>${this.getUpdateIcon(update.type)} ${update.data.title}</strong>
            <div class="small">${update.data.message}</div>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }

    getPriorityAlertClass(priority) {
        switch (priority) {
            case 'high': return 'danger';
            case 'medium': return 'warning';
            case 'low': return 'info';
            default: return 'secondary';
        }
    }

    // Mark update as read
    markAsRead(updateId) {
        const update = this.updates.find(u => u.id === updateId);
        if (update) {
            update.read = true;
            this.saveUpdatesToStorage();
            
            // Update the UI
            const updateElement = document.querySelector(`[data-update-id="${updateId}"]`);
            if (updateElement) {
                updateElement.classList.add('opacity-75');
                const button = updateElement.querySelector('.mark-read');
                if (button) {
                    button.outerHTML = '<span class="badge bg-secondary" title="Read"><i class="fas fa-check"></i></span>';
                }
            }
            
            this.updateStatistics();
        }
    }

    // Mark all updates as read
    markAllAsRead() {
        this.updates.forEach(update => {
            update.read = true;
        });
        this.saveUpdatesToStorage();
        this.displayAllUpdates();
        showNotification('All updates marked as read!', 'success');
    }

    // Clear all updates
    clearAllUpdates() {
        if (confirm('Are you sure you want to clear all updates? This cannot be undone.')) {
            this.updates = [];
            this.saveUpdatesToStorage();
            this.displayAllUpdates();
            showNotification('All updates cleared!', 'success');
        }
    }

    // Update statistics display
    updateStatistics() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const updatesToday = this.updates.filter(update => 
            new Date(update.timestamp) >= today
        ).length;

        const totalUpdates = this.updates.length;
        const readUpdates = this.updates.filter(update => update.read).length;
        const readRate = totalUpdates > 0 ? Math.round((readUpdates / totalUpdates) * 100) : 0;

        const weekAgo = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
        const updatesThisWeek = this.updates.filter(update => 
            new Date(update.timestamp) >= weekAgo
        ).length;

        const unreadCount = this.updates.filter(update => !update.read).length;

        // Update statistic elements
        const updatesTodayEl = document.getElementById('updates-today');
        const readRateEl = document.getElementById('read-rate');
        const updatesWeekEl = document.getElementById('updates-week');
        const updatesPendingEl = document.getElementById('updates-pending');

        if (updatesTodayEl) updatesTodayEl.textContent = updatesToday;
        if (readRateEl) readRateEl.textContent = readRate + '%';
        if (updatesWeekEl) updatesWeekEl.textContent = updatesThisWeek;
        if (updatesPendingEl) updatesPendingEl.textContent = unreadCount;
    }

    // Setup update preferences form
    setupUpdatePreferences() {
        const preferences = this.getNotificationPreferences();
        
        // Set checkbox states
        const checkboxes = ['match-reminders', 'result-notifications', 'fixture-changes', 'tournament-updates', 'push-notifications'];
        checkboxes.forEach(id => {
            const checkbox = document.getElementById(id);
            if (checkbox) {
                checkbox.checked = preferences[id] !== false;
            }
        });

        // Setup announcement form for admins
        if (this.isAdmin()) {
            const announcementForm = document.getElementById('announcement-form');
            if (announcementForm) {
                announcementForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleAnnouncementCreation();
                });
            }
        }
    }

    // Handle announcement creation
    handleAnnouncementCreation() {
        const title = document.getElementById('announcement-title').value;
        const message = document.getElementById('announcement-message').value;
        const priority = document.getElementById('announcement-priority').value;

        if (!title || !message) {
            showNotification('Please fill in all fields!', 'error');
            return;
        }

        this.createAnnouncement(title, message, priority);
        
        // Reset form
        document.getElementById('announcement-form').reset();
        showNotification('Announcement published successfully!', 'success');
    }

    // Save notification preferences
    savePreferences() {
        const preferences = {
            'match-reminders': document.getElementById('match-reminders').checked,
            'result-notifications': document.getElementById('result-notifications').checked,
            'fixture-changes': document.getElementById('fixture-changes').checked,
            'tournament-updates': document.getElementById('tournament-updates').checked,
            'push-notifications': document.getElementById('push-notifications').checked
        };

        localStorage.setItem('efl_notification_preferences', JSON.stringify(preferences));
        showNotification('Notification preferences saved!', 'success');
    }

    getNotificationPreferences() {
        return JSON.parse(localStorage.getItem('efl_notification_preferences') || '{}');
    }

    // Check if user is admin
    isAdmin() {
        return localStorage.getItem('efl_admin_auth') === 'true' || 
               window.location.pathname.includes('admin.html');
    }

    // Show update history in modal
    showUpdateHistory() {
        const history = this.updates.slice(0, 50); // Show last 50 updates
        
        let historyHTML = `
            <div class="table-responsive">
                <table class="table table-dark table-hover">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Title</th>
                            <th>Priority</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        history.forEach(update => {
            historyHTML += `
                <tr>
                    <td>${new Date(update.timestamp).toLocaleString()}</td>
                    <td>${this.getUpdateIcon(update.type)} ${update.type.replace('_', ' ')}</td>
                    <td>${update.data.title}</td>
                    <td><span class="badge ${this.getPriorityBadgeClass(update.priority)}">${update.priority}</span></td>
                    <td>${update.read ? '<span class="badge bg-success">Read</span>' : '<span class="badge bg-warning">Unread</span>'}</td>
                </tr>
            `;
        });

        historyHTML += `
                    </tbody>
                </table>
            </div>
            <div class="text-muted text-center mt-3">
                Showing ${history.length} of ${this.updates.length} total updates
            </div>
        `;

        this.showModal('Update History', historyHTML);
    }

    // Show modal utility function
    showModal(title, content) {
        const modalId = 'updates-modal';
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
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
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

    // Monitor for changes and create updates automatically
    startChangeMonitoring() {
        // This would typically use a more sophisticated approach
        // For now, we'll simulate by checking for new results periodically
        setInterval(() => {
            this.checkForNewResults();
        }, 30000); // Check every 30 seconds
    }

    checkForNewResults() {
        // Implementation would check for new results and create updates
        // This is a simplified version
        console.log('Checking for new results...');
    }

    // Export updates data
    exportUpdatesData() {
        const data = {
            updates: this.updates,
            exportDate: new Date().toISOString(),
            totalUpdates: this.updates.length,
            readUpdates: this.updates.filter(u => u.read).length
        };

        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `efootball_updates_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('Updates data exported successfully!', 'success');
    }
}

// Push Notification Manager
class PushNotificationManager {
    constructor() {
        this.notificationPermission = null;
        this.scheduledReminders = new Map();
        this.init();
    }

    async init() {
        // Check notification permission
        this.notificationPermission = Notification.permission;
        
        if (this.notificationPermission === 'default') {
            await this.requestPermission();
        }

        // Schedule existing fixture reminders
        this.scheduleAllReminders();
    }

    // Request notification permission
    async requestPermission() {
        try {
            this.notificationPermission = await Notification.requestPermission();
            
            if (this.notificationPermission === 'granted') {
                this.showNotification('Notifications Enabled', 
                    'You will now receive match reminders and updates.');
            }
        } catch (error) {
            console.error('Notification permission error:', error);
        }
    }

    // Schedule match reminders
    scheduleMatchReminder(fixture, reminderMinutes = 60) {
        const fixtureDateTime = new Date(`${fixture.date}T${fixture.time}`);
        const reminderTime = new Date(fixtureDateTime.getTime() - (reminderMinutes * 60 * 1000));
        const now = new Date();

        // Only schedule if reminder is in the future
        if (reminderTime > now) {
            const timeUntilReminder = reminderTime.getTime() - now.getTime();
            const reminderId = `reminder_${fixture.id}_${reminderMinutes}`;

            const timeoutId = setTimeout(() => {
                this.sendMatchReminder(fixture);
                this.scheduledReminders.delete(reminderId);
            }, timeUntilReminder);

            this.scheduledReminders.set(reminderId, timeoutId);
            
            console.log(`Scheduled reminder for fixture ${fixture.id} in ${timeUntilReminder / 1000 / 60} minutes`);
        }
    }

    // Schedule reminders for all upcoming fixtures
    scheduleAllReminders() {
        const fixtures = getData(DB_KEYS.FIXTURES).filter(f => !f.played);
        
        fixtures.forEach(fixture => {
            // Schedule multiple reminders (1 day before, 1 hour before, 15 minutes before)
            this.scheduleMatchReminder(fixture, 24 * 60); // 24 hours
            this.scheduleMatchReminder(fixture, 60);      // 1 hour
            this.scheduleMatchReminder(fixture, 15);      // 15 minutes
        });
    }

    // Send match reminder notification
    sendMatchReminder(fixture) {
        if (this.notificationPermission !== 'granted') return;

        const homePlayer = getPlayerById(fixture.homePlayerId);
        const awayPlayer = getPlayerById(fixture.awayPlayerId);

        const notificationOptions = {
            body: `${homePlayer.name} vs ${awayPlayer.name} at ${fixture.time} in ${fixture.venue}`,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png',
            tag: `match-reminder-${fixture.id}`,
            requireInteraction: true,
            actions: [
                {
                    action: 'view-fixtures',
                    title: 'View Fixtures',
                    icon: '/icons/fixtures.png'
                },
                {
                    action: 'snooze',
                    title: 'Snooze 10min',
                    icon: '/icons/snooze.png'
                }
            ],
            data: {
                fixtureId: fixture.id,
                url: `${window.location.origin}${window.location.pathname}?tab=fixtures`
            }
        };

        // Show notification
        const notification = new Notification('⚽ Match Reminder', notificationOptions);

        // Handle notification clicks
        notification.onclick = () => {
            window.focus();
            notification.close();
            // Navigate to fixtures tab
            if (typeof showTab === 'function') {
                showTab('fixtures');
            }
        };

        // Handle notification actions
        notification.addEventListener('notificationclick', (event) => {
            event.notification.close();

            if (event.action === 'view-fixtures') {
                window.focus();
                if (typeof showTab === 'function') {
                    showTab('fixtures');
                }
            } else if (event.action === 'snooze') {
                // Reschedule reminder for 10 minutes later
                setTimeout(() => {
                    this.sendMatchReminder(fixture);
                }, 10 * 60 * 1000);
            }
        });

        // Auto-close after 30 seconds
        setTimeout(() => {
            notification.close();
        }, 30000);
    }

    // Send update notification
    sendUpdateNotification(update) {
        if (this.notificationPermission !== 'granted') return;

        const notification = new Notification(
            `🔔 ${update.data.title}`,
            {
                body: update.data.message,
                icon: '/icons/icon-192x192.png',
                badge: '/icons/badge-72x72.png',
                tag: `update-${update.id}`,
                requireInteraction: true,
                data: {
                    updateId: update.id,
                    url: `${window.location.origin}${window.location.pathname}?tab=updates`
                }
            }
        );

        notification.onclick = () => {
            window.focus();
            notification.close();
            if (typeof showTab === 'function') {
                showTab('updates');
            }
        };

        // Auto-close after 10 seconds
        setTimeout(() => {
            notification.close();
        }, 10000);
    }

    // Custom notification types
    sendCustomNotification(title, message, options = {}) {
        if (this.notificationPermission !== 'granted') return;

        const notification = new Notification(title, {
            body: message,
            icon: options.icon || '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png',
            ...options
        });

        notification.onclick = () => {
            window.focus();
            notification.close();
        };

        return notification;
    }

    // Cancel scheduled reminders
    cancelReminder(fixtureId) {
        const reminderIds = [
            `reminder_${fixtureId}_1440`, // 24 hours
            `reminder_${fixtureId}_60`,   // 1 hour
            `reminder_${fixtureId}_15`    // 15 minutes
        ];

        reminderIds.forEach(reminderId => {
            const timeoutId = this.scheduledReminders.get(reminderId);
            if (timeoutId) {
                clearTimeout(timeoutId);
                this.scheduledReminders.delete(reminderId);
            }
        });
    }
}

// Initialize tournament updates
const tournamentUpdates = new TournamentUpdates();

// Global access
window.tournamentUpdates = tournamentUpdates;
window.PushNotificationManager = PushNotificationManager;