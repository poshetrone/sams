import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

/**
 * Callback OAuth Discord.
 * 1. Échange le code contre une session.
 * 2. Retrouve le membre par discord_id.
 *    - membre trouvé  -> entrée dans l'app (/).
 *    - sinon          -> crée/maintient une demande d'accès (pending) -> /pending.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const errorDesc = searchParams.get('error_description')

  if (errorDesc) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorDesc)}`)
  }
  if (!code) {
    return NextResponse.redirect(`${origin}/login`)
  }

  const supabase = createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(`${origin}/login`)
  }

  // Identité Discord
  const meta = user.user_metadata || {}
  const discordId: string | undefined = meta.provider_id || user.identities?.[0]?.id
  const pseudo: string = meta.name || meta.preferred_username || meta.user_name || ''
  const fullName: string = meta.full_name || meta.name || pseudo || 'Membre Discord'

  const admin = createServiceClient()

  // Membre déjà rattaché ? -> accès autorisé
  if (discordId) {
    const { data: member } = await admin
      .from('members')
      .select('id')
      .eq('discord_id', discordId)
      .maybeSingle()

    if (member) {
      return NextResponse.redirect(`${origin}/`)
    }
  }

  // Pas de membre -> on s'assure qu'une demande d'accès existe (pending) puis /pending
  if (discordId) {
    const { data: existing } = await admin
      .from('accesses')
      .select('id, status')
      .eq('discord_id', discordId)
      .maybeSingle()

    if (existing?.status === 'approved') {
      // Approuvé mais pas encore créé en membre : on laisse passer, l'app gérera.
      return NextResponse.redirect(`${origin}/`)
    }

    if (!existing) {
      await admin.from('accesses').insert({
        name: fullName,
        discord: pseudo,
        discord_id: discordId,
        status: 'pending',
      })
    }
  }

  return NextResponse.redirect(`${origin}/pending`)
}
