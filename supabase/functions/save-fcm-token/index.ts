import { serve } from "https://deno.land/std@0.182.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
};

serve(async (req) => {
  // Handle browser preflight request
  if (req.method === "OPTIONS") {
    return new Response("OK", { status: 200, headers: corsHeaders });
  }

  try {
    const bodyText = await req.text();
    const json = bodyText ? JSON.parse(bodyText) : {};

    const token = json.token;
    const player_id = json.player_id || null;
    const device_info = json.device_info || {};

    if (!token) {
      return new Response(
        JSON.stringify({ success: false, message: "Missing token" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // UPSERT using Postgres
    const { error } = await supabase
      .from("fcm_tokens")
      .upsert(
        {
          token,
          player_id,
          device_info
        },
        { onConflict: "token" }
      );

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
      JSON.stringify({ success: false, message: String(err) }),
      { status: 500, headers: corsHeaders }
    );
  }
});
