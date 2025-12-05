const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Your VAPID keys
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

webpush.setVapidDetails(
  'mailto:support@kishtechsite.online',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

module.exports = (app) => {
  app.post('/api/send-notification', async (req, res) => {
    try {
      const { title, body } = req.body;
      if (!title || !body)
        return res.status(400).json({ success: false, message: 'Missing title or body' });

      const { data: subs, error } = await supabase
        .from('push_subscriptions')
        .select('subscription');

      if (error) throw error;
      if (!subs || subs.length === 0)
        return res.status(404).json({ success: false, message: 'No subscriptions found' });

      const payload = JSON.stringify({ title, body });

      // Send notification to all subscribers
      const sendPromises = subs.map(({ subscription }) =>
        webpush.sendNotification(subscription, payload).catch((err) => {
          console.error('Push error:', err);
        })
      );

      await Promise.all(sendPromises);

      res.json({ success: true, message: 'Notifications sent successfully' });
    } catch (err) {
      console.error('❌ Notification sending failed:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });
};
