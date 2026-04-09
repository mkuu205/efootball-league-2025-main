import { successResponse, errorResponse } from '../utils/response.js';
import * as notificationService from '../services/notificationService.js';

const notificationController = {
  // GET /api/notifications
  getNotifications: async (req, res) => {
    try {
      const notifications = await notificationService.getUserNotifications(req.user.id);
      const unreadCount = await notificationService.getUnreadCount(req.user.id);

      successResponse(res, 'Notifications retrieved', {
        notifications,
        unread_count: unreadCount
      });
    } catch (error) {
      console.error('❌ Get notifications error:', error);
      errorResponse(res, 'Failed to get notifications', 500);
    }
  },

  // POST /api/notifications/:id/read
  markAsRead: async (req, res) => {
    try {
      const { id } = req.params;
      const notification = await notificationService.markAsRead(id, req.user.id);

      if (!notification) {
        return errorResponse(res, 'Notification not found', 404);
      }

      successResponse(res, 'Notification marked as read', notification);
    } catch (error) {
      console.error('❌ Mark as read error:', error);
      errorResponse(res, 'Failed to mark notification as read', 500);
    }
  },

  // POST /api/notifications/read-all
  markAllAsRead: async (req, res) => {
    try {
      const result = await notificationService.markAllAsRead(req.user.id);
      successResponse(res, 'All notifications marked as read', result);
    } catch (error) {
      console.error('❌ Mark all as read error:', error);
      errorResponse(res, 'Failed to mark all notifications as read', 500);
    }
  }
};

export default notificationController;
