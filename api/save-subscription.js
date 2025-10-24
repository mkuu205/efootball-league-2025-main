// api/save-subscription.js
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const subscription = req.body;

    const { error } = await supabase
      .from("push_subscriptions")
      .insert([{ subscription }])
      .select();

    if (error) throw error;

    res.json({ success: true });
  } catch (err) {
    console.error("Save subscription failed:", err);
    res.status(500).json({ success: false, error: err.message });
  }
}
