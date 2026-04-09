// Notification system for frontend
const notificationSystem = {
  unreadCount: 0,

  init: async () => {
    if (!auth.isAuthenticated()) return;

    await notificationSystem.loadNotifications();
    notificationSystem.setupUI();
    
    // Poll for new notifications every 30 seconds
    setInterval(() => {
      notificationSystem.loadNotifications();
    }, 30000);
  },

  loadNotifications: async () => {
    try {
      const response = await api.get('/api/notifications');
      notificationSystem.unreadCount = response.data.unread_count;
      notificationSystem.updateBadge();
      return response.data.notifications;
    } catch (error) {
      console.error('Failed to load notifications:', error);
      return [];
    }
  },

  setupUI: () => {
    const bellIcon = document.getElementById('notification-bell');
    if (!bellIcon) return;

    bellIcon.addEventListener('click', async () => {
      const panel = document.getElementById('notification-panel');
      if (!panel) return;

      panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
      
      if (panel.style.display === 'block') {
        await notificationSystem.loadNotificationList();
      }
    });
  },

  updateBadge: () => {
    const badge = document.getElementById('notification-count');
    if (badge) {
      badge.textContent = notificationSystem.unreadCount;
      badge.style.display = notificationSystem.unreadCount > 0 ? 'flex' : 'none';
    }
  },

  loadNotificationList: async () => {
    const list = document.getElementById('notification-list');
    if (!list) return;

    try {
      const notifications = await notificationSystem.loadNotifications();
      
      if (notifications.length === 0) {
        list.innerHTML = '<p style="padding: 1rem; text-align: center; color: var(--text-secondary);">No notifications</p>';
        return;
      }

      list.innerHTML = notifications.slice(0, 20).map(n => `
        <div style="padding: 1rem; border-bottom: 1px solid var(--card-border); ${n.read ? 'opacity: 0.6;' : ''}">
          <div style="display: flex; justify-content: space-between; align-items: start;">
            <div style="flex: 1;">
              <strong style="color: var(--text-primary);">${n.title}</strong>
              <p style="margin: 0.5rem 0; color: var(--text-secondary); font-size: 0.9rem;">${n.message}</p>
              <small style="color: var(--text-secondary);">${new Date(n.created_at).toLocaleString()}</small>
            </div>
            ${!n.read ? '<span style="background: var(--primary); width: 8px; height: 8px; border-radius: 50%; display: inline-block;"></span>' : ''}
          </div>
        </div>
      `).join('');
    } catch (error) {
      list.innerHTML = '<p style="padding: 1rem; text-align: center; color: var(--danger);">Failed to load notifications</p>';
    }
  },

  markAsRead: async (notificationId) => {
    try {
      await api.post(`/api/notifications/${notificationId}/read`);
      await notificationSystem.loadNotifications();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  },

  markAllAsRead: async () => {
    try {
      await api.post('/api/notifications/read-all');
      await notificationSystem.loadNotifications();
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  }
};
