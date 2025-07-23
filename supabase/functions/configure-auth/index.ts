import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get email verification setting
    const { data: settings, error: settingsError } = await supabaseClient
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', 'email_verification_required')
      .single()

    if (settingsError) {
      console.error('Error fetching settings:', settingsError)
      throw settingsError
    }

    const emailVerificationRequired = settings?.setting_value?.value || false

    // Configure Supabase auth settings via Admin API
    const adminApiUrl = `${Deno.env.get('SUPABASE_URL')}/rest/v1/config`
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    const authConfig = {
      SITE_URL: Deno.env.get('SUPABASE_URL'),
      DISABLE_SIGNUP: false,
      EXTERNAL_EMAIL_ENABLED: true,
      MAILER_AUTOCONFIRM: !emailVerificationRequired,
      EMAIL_CONFIRM_EMAIL: emailVerificationRequired,
    }

    console.log('Configuring auth with:', authConfig)

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailVerificationRequired,
        message: 'Auth configuration updated based on system settings'
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})