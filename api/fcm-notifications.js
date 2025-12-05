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

// Firebase initialization
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
    console.log('ℹ️ Save your service account as firebase-service-account.json');
  }
}

export default function (app) {
  initializeFirebase();

  // --------------------------
  // 1️⃣ SAVE FCM TOKEN
  // --------------------------
  app.post('/api/save-fcm-token', async (req, res) => {
    try {
      const { token, player_id, device_info } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'FCM token is required',
        });
      }

      // FIX: remove created_at/updated_at (Supabase handles automatically)
      const { error } = await supabase
        .from('fcm_tokens')
        .upsert(
          {
            token,
            player_id: player_id || null,
            device_info: device_info || {},
          },
          { onConflict: 'token' }
        );

      if (error) throw error;

      res.json({
        success: true,
        message: 'FCM token saved successfully',
      });

    } catch (error) {
      console.error('❌ Error saving FCM token:', error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // --------------------------
  // 2️⃣ SEND TO SPECIFIC PLAYER
  // --------------------------
  app.post('/api/send-notification-to-player', async (req, res) => {
    try {
      const { player_id, title, body, data } = req.body;

      if (!firebaseInitialized) {
        return res.status(500).json({ success: false, message: 'Firebase not initialized' });
      }

      if (!player_id || !title || !body) {
        return res.status(400).json({
          success: false,
          message: 'player_id, title, and body are required'
        });
      }

      const { data: tokens, error } = await supabase
        .from('fcm_tokens')
        .select('token')
        .eq('player_id', player_id);

      if (error) throw error;

      if (!tokens?.length) {
        return res.status(404).json({
          success: false,
          message: 'No FCM tokens for this player'
        });
      }

      const message = {
        notification: { title, body },
        data: data || {},
        tokens: tokens.map(t => t.token)
      };

      const response = await admin.messaging().sendEachForMulticast(message);

      res.json({
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount
      });

    } catch (error) {
      console.error('❌ Error sending notification:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // --------------------------
  // 3️⃣ SEND TO ALL USERS
  // --------------------------
  app.post('/api/send-notification-to-all', async (req, res) => {
    try {
      const { title, body, data } = req.body;

      if (!firebaseInitialized) {
        return res.status(500).json({ success: false, message: 'Firebase not initialized' });
      }

      if (!title || !body) {
        return res.status(400).json({ success: false, message: 'title and body are required' });
      }

      const { data: tokens, error } = await supabase
        .from('fcm_tokens')
        .select('token');

      if (error) throw error;

      if (!tokens?.length) {
        return res.status(404).json({ success: false, message: 'No FCM tokens found' });
      }

      // FCM batch limit is 500
      const batchSize = 500;
      let successTotal = 0;
      let failTotal = 0;

      for (let i = 0; i < tokens.length; i += batchSize) {
        const batchTokens = tokens.slice(i, i + batchSize).map(t => t.token);

        const message = {
          notification: { title, body },
          data: data || {},
          tokens: batchTokens
        };

        const result = await admin.messaging().sendEachForMulticast(message);
        successTotal += result.successCount;
        failTotal += result.failureCount;
      }

      res.json({
        success: true,
        successCount: successTotal,
        failureCount: failTotal,
        totalTokens: tokens.length
      });

    } catch (error) {
      console.error('❌ Sending failed:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // --------------------------
  // 4️⃣ COUNT TOKENS
  // --------------------------
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
      console.error('❌ Count error:', error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  });
}
