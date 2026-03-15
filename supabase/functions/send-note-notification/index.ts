import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  // Payload fra Webhook inneholder 'record' (det nye notatet)
  const { record } = await req.json()

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Henter alle registrerte push-tokens fra tabellen din
  const { data: tokens, error } = await supabase
    .from('user_tokens')
    .select('expo_push_token')

  if (!tokens || tokens.length === 0) {
    return new Response(JSON.stringify({ message: "Ingen tokens funnet" }), { status: 200 })
  }

  // Content Injection: Her henter vi tittelen direkte fra notatet
  const notifications = tokens.map(t => ({
    to: t.expo_push_token,
    sound: 'default',
    title: 'Nytt notat lagt til! 📝',
    body: `Overskrift: ${record.tittel}`, // Bruker 'tittel' fra databasen
    data: { id: record.id }
  }))

  // Send til Expo sin Push API
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(notifications),
  })

  return new Response(JSON.stringify({ done: true }), { status: 200 })
})