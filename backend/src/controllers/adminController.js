import { successResponse, errorResponse } from '../utils/response.js';
import { createNotificationForAll } from '../services/notificationService.js';

const adminController = {
  // POST /api/admin/notify-all
  notifyAll: async (req, res) => {
    try {
      const { title, message, type = 'system' } = req.body;

      if (!title || !message) {
        return errorResponse(res, 'Title and message are required', 400);
      }

      const notifications = await createNotificationForAll({
        title,
        message,
        type
      });

      successResponse(res, 'Notifications sent to all users', {
        sent_count: notifications.length
      });
    } catch (error) {
      console.error('❌ Notify all error:', error);
      errorResponse(res, 'Failed to send notifications', 500);
    }
  }
};

export default adminController;
