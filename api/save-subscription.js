const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = (app) => {
  app.post('/api/save-subscription', async (req, res) => {
    try {
      const subscription = req.body;
      if (!subscription) {
        return res.status(400).json({ success: false, message: 'Missing subscription data' });
      }

      const { error } = await supabase
        .from('push_subscriptions')
        .insert([{ subscription }]);

      if (error) throw error;

      res.json({ success: true, message: 'Subscription saved successfully' });
    } catch (err) {
      console.error('❌ Save subscription failed:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });
};
