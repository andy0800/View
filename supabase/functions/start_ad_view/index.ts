import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    const { ad_id } = await req.json()
    if (!ad_id) throw new Error('Missing ad_id')

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Check 24h cooldown — same viewer cannot re-watch same ad within 24h
    // FIXED: Use the exact same logic as rpc_get_viewer_ads to ensure consistency!
    const { data: isCooldownActive, error: cooldownError } = await supabaseAdmin
      .rpc('is_in_reward_cooldown', { p_user_id: user.id, p_ad_id: ad_id })

    if (cooldownError) throw cooldownError

    if (isCooldownActive) {
      return new Response(JSON.stringify({ success: false, error: 'Cooldown active', cooldown_remaining_hours: 24 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429,
      })
    }

    // Create new view event
    const { data: viewEvent, error } = await supabaseAdmin
      .from('view_events')
      .insert({ viewer_id: user.id, ad_id, is_rewarded: false })
      .select('id')
      .single()

    if (error) throw error

    return new Response(JSON.stringify({ success: true, view_event_id: viewEvent.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400,
    })
  }
})
