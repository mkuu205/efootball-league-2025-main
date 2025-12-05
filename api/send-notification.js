const admin = require("firebase-admin");
const { createClient } = require("@supabase/supabase-js");

// ---------------------------
// Firebase Admin Initialization
// ---------------------------
let serviceAccount;

try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} catch (e) {
  console.error("❌ FIREBASE_SERVICE_ACCOUNT is not valid JSON");
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

// ---------------------------
// Supabase Initialization
// ---------------------------
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ---------------------------
// SINGLE API ENDPOINT
// ---------------------------
module.exports = async function (req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed"
    });
  }

  try {
    const { title, body, data } = req.body;

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        message: "Missing title or body"
      });
    }

    // Fetch FCM tokens
    const { data: tokens, error } = await supabase
      .from("fcm_tokens")
      .select("token");

    if (error) throw error;

    if (!tokens || tokens.length === 0) {
      return res.json({
        success: false,
        message: "No tokens found"
      });
    }

    const tokenList = tokens.map((t) => t.token);

    // Prepare FCM payload
    const message = {
      notification: { title, body },
      data: data || {},
      tokens: tokenList
    };

    // Send notifications
    const response = await admin.messaging().sendEachForMulticast(message);

    return res.json({
      success: true,
      sent: response.successCount,
      failed: response.failureCount
    });

  } catch (err) {
    console.error("❌ Error sending FCM:", err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
