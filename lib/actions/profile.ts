'use server'
import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'

/** Met à jour la photo de profil du membre connecté (upload Storage `media`). */
export async function updateMyPhoto(dataUrl: string): Promise<{ ok: boolean; url?: string; error?: string }> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Non authentifié' }

  const meta = user.user_metadata || {}
  const discordId: string | undefined = meta.provider_id || user.identities?.[0]?.id
  if (!discordId) return { ok: false, error: 'Identité Discord introuvable' }

  const admin = createServiceClient()
  const { data: member } = await admin.from('members').select('id').eq('discord_id', discordId).maybeSingle()
  if (!member) return { ok: false, error: 'Membre introuvable' }

  // data URL -> buffer
  const match = dataUrl.match(/^data:(.+);base64,(.*)$/)
  if (!match) return { ok: false, error: 'Image invalide' }
  const contentType = match[1]
  const buffer = Buffer.from(match[2], 'base64')
  const ext = contentType.split('/')[1]?.split('+')[0] || 'png'
  const path = `avatars/${member.id}.${ext}`

  const { error: upErr } = await admin.storage.from('media').upload(path, buffer, {
    contentType,
    upsert: true,
  })
  if (upErr) return { ok: false, error: upErr.message }

  const { data: pub } = admin.storage.from('media').getPublicUrl(path)
  const url = `${pub.publicUrl}?v=${Date.now()}`

  const { error: updErr } = await admin.from('members').update({ photo: url }).eq('id', member.id)
  if (updErr) return { ok: false, error: updErr.message }

  revalidatePath('/', 'layout')
  return { ok: true, url }
}
