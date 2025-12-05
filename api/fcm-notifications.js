import admin from 'firebase-admin';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Initialize Firebase Admin SDK
let firebaseInitialized = false;

function initializeFirebase() {
  if (firebaseInitialized) return;
  
  try {
    const serviceAccount = JSON.parse(
      readFileSync('./firebase-service-account.json', 'utf8')
    );
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    
    firebaseInitialized = true;
    console.log('✅ Firebase Admin initialized');
  } catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error.message);
    console.log('ℹ️  Download your Firebase service account key and save as firebase-service-account.json');
  }
}

export default function(app) {
  // Initialize Firebase on module load
  initializeFirebase();

  // Save FCM token
  app.post('/api/save-fcm-token', async (req, res) => {
    try {
      const { token, player_id, device_info } = req.body;

      if (!token) {
        return res.status(400).json({ 
          success: false, 
          message: 'FCM token is required' 
        });
      }

      // Save or update token in database
      const { data, error } = await supabase
        .from('fcm_tokens')
        .upsert({
          token,
          player_id: player_id || null,
          device_info: device_info || {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'token'
        });

      if (error) throw error;

      res.json({ 
        success: true, 
        message: 'FCM token saved successfully' 
      });
    } catch (error) {
      console.error('❌ Error saving FCM token:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  });

  // Send notification to specific player
  app.post('/api/send-notification-to-player', async (req, res) => {
    try {
      if (!firebaseInitialized) {
        return res.status(500).json({ 
          success: false, 
          message: 'Firebase not initialized. Check firebase-service-account.json' 
        });
      }

      const { player_id, title, body, data } = req.body;

      if (!player_id || !title || !body) {
        return res.status(400).json({ 
          success: false, 
          message: 'player_id, title, and body are required' 
        });
      }

      // Get player's FCM tokens
      const { data: tokens, error } = await supabase
        .from('fcm_tokens')
        .select('token')
        .eq('player_id', player_id);

      if (error) throw error;

      if (!tokens || tokens.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'No FCM tokens found for this player' 
        });
      }

      // Send notification to all player's devices
      const message = {
        notification: {
          title,
          body
        },
        data: data || {},
        tokens: tokens.map(t => t.token)
      };

      const response = await admin.messaging().sendEachForMulticast(message);

      console.log(`✅ Sent ${response.successCount} notifications to player ${player_id}`);

      res.json({ 
        success: true, 
        successCount: response.successCount,
        failureCount: response.failureCount
      });
    } catch (error) {
      console.error('❌ Error sending notification:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  });

  // Send notification to all users
  app.post('/api/send-notification-to-all', async (req, res) => {
    try {
      if (!firebaseInitialized) {
        return res.status(500).json({ 
          success: false, 
          message: 'Firebase not initialized' 
        });
      }

      const { title, body, data } = req.body;

      if (!title || !body) {
        return res.status(400).json({ 
          success: false, 
          message: 'title and body are required' 
        });
      }

      // Get all FCM tokens
      const { data: tokens, error } = await supabase
        .from('fcm_tokens')
        .select('token');

      if (error) throw error;

      if (!tokens || tokens.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'No FCM tokens found' 
        });
      }

      // Send in batches of 500 (FCM limit)
      const batchSize = 500;
      let totalSuccess = 0;
      let totalFailure = 0;

      for (let i = 0; i < tokens.length; i += batchSize) {
        const batch = tokens.slice(i, i + batchSize).map(t => t.token);

        const message = {
          notification: {
            title,
            body
          },
          data: data || {},
          tokens: batch
        };

        const response = await admin.messaging().sendEachForMulticast(message);
        totalSuccess += response.successCount;
        totalFailure += response.failureCount;
      }

      console.log(`✅ Sent ${totalSuccess} notifications to all users`);

      res.json({ 
        success: true, 
        successCount: totalSuccess,
        failureCount: totalFailure,
        totalTokens: tokens.length
      });
    } catch (error) {
      console.error('❌ Error sending notifications:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  });

  // Send notification about new fixture
  app.post('/api/notify-fixture', async (req, res) => {
    try {
      const { fixture_id, home_player_id, away_player_id, date, time } = req.body;

      // Get player names
      const { data: players } = await supabase
        .from('players')
        .select('id, name')
        .in('id', [home_player_id, away_player_id]);

      const homePlayer = players?.find(p => p.id === home_player_id);
      const awayPlayer = players?.find(p => p.id === away_player_id);

      if (!homePlayer || !awayPlayer) {
        return res.status(404).json({ 
          success: false, 
          message: 'Players not found' 
        });
      }

      const title = '⚽ New Match Scheduled!';
      const body = `${homePlayer.name} vs ${awayPlayer.name} on ${date} at ${time}`;

      // Send to both players
      await Promise.all([
        sendNotificationToPlayer(home_player_id, title, body, { fixture_id: String(fixture_id), type: 'fixture' }),
        sendNotificationToPlayer(away_player_id, title, body, { fixture_id: String(fixture_id), type: 'fixture' })
      ]);

      res.json({ success: true, message: 'Fixture notifications sent' });
    } catch (error) {
      console.error('❌ Error sending fixture notification:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Get FCM tokens count
  app.get('/api/fcm-tokens-count', async (req, res) => {
    try {
      const { count, error } = await supabase
        .from('fcm_tokens')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;

      res.json({ 
        success: true, 
        count: count || 0 
      });
    } catch (error) {
      console.error('❌ Error getting FCM tokens count:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message,
        count: 0
      });
    }
  });

  // Helper function
  async function sendNotificationToPlayer(player_id, title, body, data) {
    if (!firebaseInitialized) return;

    const { data: tokens } = await supabase
      .from('fcm_tokens')
      .select('token')
      .eq('player_id', player_id);

    if (tokens && tokens.length > 0) {
      const message = {
        notification: { title, body },
        data: data || {},
        tokens: tokens.map(t => t.token)
      };

      await admin.messaging().sendEachForMulticast(message);
    }
  }
}
