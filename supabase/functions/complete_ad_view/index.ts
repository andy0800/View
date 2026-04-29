import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } })
  }

  try {
    // Initialize Supabase Client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Get Viewer ID from Auth context
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    // Parse Body
    const { ad_id, view_event_id } = await req.json()
    if (!ad_id || !view_event_id) throw new Error('Missing ad_id or view_event_id')

    // Initialize Admin Client to call RPC securely (bypassing RLS if necessary, or just use regular client if RLS allows RPC)
    // Actually, calling the RPC via the user's client is better for security, assuming they have EXECUTE permissions.
    // However, the RPC modifies company wallets which the user might not have RLS access to update via standard queries.
    // Wait, RPC runs with DEFINER privileges by default? No, usually INVOKER. Let's use service_role to ensure it runs without RLS blocking cross-wallet operations inside the transaction.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Call the RPC
    const { data, error } = await supabaseAdmin.rpc('rpc_complete_ad_view', {
      p_viewer_id: user.id,
      p_ad_id: ad_id,
      p_view_event_id: view_event_id
    })

    if (error) throw error
    if (data && !data.success) throw new Error(data.error)

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: 400,
    })
  }
})
