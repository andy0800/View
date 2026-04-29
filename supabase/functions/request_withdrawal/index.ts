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

    const { amount_kwd, bank_details } = await req.json()
    if (!amount_kwd || !bank_details) throw new Error('Missing amount or bank details')

    const amountKWD = parseFloat(amount_kwd)
    if (isNaN(amountKWD) || amountKWD <= 0) throw new Error('Invalid withdrawal amount')

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const amountMicro = Math.round(amountKWD * 1_000_000)

    // Call the atomic RPC
    const { data, error } = await supabaseAdmin.rpc('rpc_request_withdrawal', {
      p_user_id: user.id,
      p_amount: amountMicro,
      p_bank_details: bank_details,
    })

    if (error) throw error
    if (data && !data.success) throw new Error(data.error)

    return new Response(JSON.stringify({ success: true, withdrawal_id: data?.withdrawal_id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400,
    })
  }
})
