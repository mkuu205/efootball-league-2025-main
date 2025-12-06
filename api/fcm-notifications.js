import admin from 'firebase-admin';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

// Supabase Admin
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

let fcmReady = false;

/* ===================== INIT FIREBASE ===================== */
function initFirebase() {
  if (admin.apps.length) {
    fcmReady = true;
    return;
  }

  try {
    let serviceAccount;

    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } else if (fs.existsSync('./firebase-service-account.json')) {
      serviceAccount = JSON.parse(
        fs.readFileSync('./firebase-service-account.json', 'utf8')
      );
    } else {
      throw new Error('Missing Firebase service account');
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    fcmReady = true;
    console.log('✅ FCM: Firebase Admin initialized');

  } catch (err) {
    console.error('❌ FCM init failed:', err.message);
    fcmReady = false;
  }
}

export default function fcmNotifications(app) {
  console.log('✅ FCM module loaded');
  initFirebase();

  /* ===================== COUNT TOKENS ===================== */
  app.get('/api/fcm-tokens-count', async (_req, res) => {
    console.log('📊 FCM tokens count endpoint hit');

    if (!fcmReady) {
      return res.status(500).json({
        success: false,
        message: 'FCM not initialized'
      });
    }

    const { count, error } = await supabase
      .from('fcm_tokens')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }

    res.json({
      success: true,
      count: count || 0
    });
  });

  /* ===================== SAVE TOKEN ===================== */
  app.post('/api/save-fcm-token', async (req, res) => {
    if (!fcmReady) {
      return res.status(500).json({ success: false, message: 'FCM not ready' });
    }

    const { token, player_id, device_info } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Token required' });
    }

    await supabase
      .from('fcm_tokens')
      .upsert(
        { token, player_id: player_id || null, device_info: device_info || {} },
        { onConflict: 'token' }
      );

    res.json({ success: true });
  });

  /* ===================== SEND TO ALL ===================== */
  app.post('/api/send-notification-to-all', async (req, res) => {
    if (!fcmReady) {
      return res.status(500).json({ success: false, message: 'FCM not ready' });
    }

    const { title, body, data } = req.body;

    const { data: tokens } = await supabase
      .from('fcm_tokens')
      .select('token');

    if (!tokens?.length) {
      return res.json({ success: false, message: 'No subscribers' });
    }

    const response = await admin.messaging().sendEachForMulticast({
      notification: { title, body },
      data: data || {},
      tokens: tokens.map(t => t.token)
    });

    // auto-clean invalid tokens
    const invalid = [];
    response.responses.forEach((r, i) => {
      const code = r.error?.code || '';
      if (
        !r.success &&
        (code.includes('registration-token-not-registered') ||
         code.includes('invalid-registration-token'))
      ) {
        invalid.push(tokens[i].token);
      }
    });

    if (invalid.length) {
      await supabase.from('fcm_tokens').delete().in('token', invalid);
    }

    res.json({
      success: true,
      sent: response.successCount,
      failed: response.failureCount,
      cleaned: invalid.length
    });
  });
}
