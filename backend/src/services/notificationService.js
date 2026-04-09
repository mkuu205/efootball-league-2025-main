import db from '../config/db.js';

// Create notification for a single user
export const createNotification = async ({ user_id, title, message, type = 'system' }) => {
  try {
    const result = await db.query(
      'INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4) RETURNING *',
      [user_id, title, message, type]
    );
    return result.rows[0];
  } catch (error) {
    console.error('❌ Error creating notification:', error);
    throw error;
  }
};

// Create notifications for all users
export const createNotificationForAll = async ({ title, message, type = 'system' }) => {
  try {
    const usersResult = await db.query('SELECT id FROM player_accounts');
    const notifications = [];

    for (const user of usersResult.rows) {
      const notification = await createNotification({
        user_id: user.id,
        title,
        message,
        type
      });
      notifications.push(notification);
    }

    return notifications;
  } catch (error) {
    console.error('❌ Error creating notifications for all users:', error);
    throw error;
  }
};

// Get notifications for a user
export const getUserNotifications = async (userId, limit = 50) => {
  try {
    const result = await db.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
      [userId, limit]
    );
    return result.rows;
  } catch (error) {
    console.error('❌ Error getting user notifications:', error);
    throw error;
  }
};

// Mark notification as read
export const markAsRead = async (notificationId, userId) => {
  try {
    const result = await db.query(
      'UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2 RETURNING *',
      [notificationId, userId]
    );
    return result.rows[0];
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    throw error;
  }
};

// Mark all notifications as read for a user
export const markAllAsRead = async (userId) => {
  try {
    const result = await db.query(
      'UPDATE notifications SET read = true WHERE user_id = $1 AND read = false',
      [userId]
    );
    return { updated: result.rowCount };
  } catch (error) {
    console.error('❌ Error marking all notifications as read:', error);
    throw error;
  }
};

// Get unread count
export const getUnreadCount = async (userId) => {
  try {
    const result = await db.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND read = false',
      [userId]
    );
    return parseInt(result.rows[0].count);
  } catch (error) {
    console.error('❌ Error getting unread count:', error);
    throw error;
  }
};
