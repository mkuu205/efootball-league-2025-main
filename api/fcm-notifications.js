import admin from "firebase-admin";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

// ✅ SUPABASE
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ✅ FIREBASE ADMIN INIT
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(
    readFileSync("./firebase-service-account.json", "utf8")
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

export default function (app) {

  // ✅ SAVE TOKEN
  app.post("/api/save-fcm-token", async (req, res) => {
    const { token, player_id, device_info } = req.body;

    await supabase
      .from("fcm_tokens")
      .upsert({ token, player_id, device_info }, { onConflict: "token" });

    res.json({ success: true });
  });

  // ✅ SEND TO ALL + AUTO CLEAN
  app.post("/api/send-notification-to-all", async (req, res) => {
    const { title, body, data } = req.body;

    const { data: tokens } = await supabase
      .from("fcm_tokens")
      .select("token");

    if (!tokens?.length) {
      return res.json({ success: false, message: "No subscribers" });
    }

    const message = {
      notification: { title, body },
      data: data || {},
      tokens: tokens.map(t => t.token)
    };

    const result = await admin.messaging().sendEachForMulticast(message);

    // ✅ AUTO DELETE INVALID TOKENS
    const invalidTokens = [];
    result.responses.forEach((r, i) => {
      if (!r.success) {
        const code = r.error?.code || "";
        if (
          code.includes("registration-token-not-registered") ||
          code.includes("invalid-registration-token")
        ) {
          invalidTokens.push(tokens[i].token);
        }
      }
    });

    if (invalidTokens.length) {
      await supabase
        .from("fcm_tokens")
        .delete()
        .in("token", invalidTokens);
    }

    console.log("✅ Sent:", result.successCount);
    console.log("🧹 Removed invalid tokens:", invalidTokens.length);

    res.json({
      success: true,
      sent: result.successCount,
      failed: result.failureCount,
      cleaned: invalidTokens.length
    });
  });
}
