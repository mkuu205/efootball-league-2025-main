import { serve } from "https://deno.land/std@0.182.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // FIX: Read raw body ALWAYS
    const text = await req.text();
    console.log("RAW BODY:", text);

    let json = {};
    try {
      json = text ? JSON.parse(text) : {};
    } catch (e) {
      console.log("JSON PARSE ERROR", e);
    }

    const token = json.token;
    const player_id = json.player_id || null;
    const device_info = json.device_info || {};

    if (!token) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Missing token",
          received: json
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Create Supabase service client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Save or update token
    const { error } = await supabase
      .from("fcm_tokens")
      .upsert({
        token,
        player_id,
        device_info
      });

    if (error) {
      return new Response(
        JSON.stringify({ success: false, message: error.message }),
        { status: 400, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: corsHeaders }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
