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

    // Verify user is an advertiser
    const { data: profile } = await supabaseClient.from('users').select('role, status').eq('id', user.id).single()
    if (!profile || profile.role !== 'advertiser') throw new Error('Only advertisers can purchase packages')
    if (profile.status !== 'active') throw new Error('Account not active')

    const { package_id, budget_kwd } = await req.json()
    if (!package_id || !budget_kwd) throw new Error('Missing package_id or budget_kwd')

    const budgetKWD = parseFloat(budget_kwd)
    if (isNaN(budgetKWD) || budgetKWD < 300) throw new Error('Minimum budget is 300 KWD')
    if (budgetKWD % 100 !== 0) throw new Error('Budget must be in 100 KWD increments')

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify package exists
    const { data: pkg } = await supabaseAdmin.from('advertiser_packages').select('id').eq('id', package_id).eq('is_active', true).single()
    if (!pkg) throw new Error('Package not found or inactive')

    const budgetMicro = Math.round(budgetKWD * 1_000_000)

    const { error } = await supabaseAdmin.from('purchased_packages').insert({
      advertiser_id: user.id,
      package_id,
      total_budget: budgetMicro,
      remaining_budget: budgetMicro,
      status: 'active',
    })
    if (error) throw error

    return new Response(JSON.stringify({ success: true, budget_micro: budgetMicro }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400,
    })
  }
})
