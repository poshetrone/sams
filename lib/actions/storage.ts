'use server'
import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentMember } from '@/lib/auth'

/**
 * Upload générique d'un fichier (data URL) dans le bucket Storage `media`.
 * Renvoie l'URL publique. Utilisé par TOUS les uploads d'images de l'app
 * (photos, pièces d'identité, clichés, logos, contrats, trombi, fusillades…).
 */
export async function uploadToMedia(
  folder: string,
  fileName: string,
  mime: string,
  dataUrl: string
): Promise<{ ok: boolean; url?: string; error?: string }> {
  const me = await getCurrentMember()
  if (!me) return { ok: false, error: 'Non authentifié' }

  const match = dataUrl.match(/^data:(.+?);base64,(.*)$/)
  if (!match) return { ok: false, error: 'Fichier invalide' }
  // Le type embarqué dans le data URL fait foi (ex : image/webp après compression).
  const contentType = match[1] || mime || 'application/octet-stream'
  const buffer = Buffer.from(match[2], 'base64')

  const admin = createServiceClient()
  // S'assure que le bucket existe (idempotent ; ignore « déjà créé »).
  await admin.storage.createBucket('media', { public: true })

  const safe = (fileName || 'file').replace(/[^a-zA-Z0-9._-]/g, '_').slice(-60)
  const path = `${folder.replace(/[^a-z0-9/_-]/gi, '')}/${Date.now()}-${Math.round(Math.random() * 1e6)}-${safe}`
  const { error } = await admin.storage.from('media').upload(path, buffer, { contentType, upsert: true })
  if (error) return { ok: false, error: error.message }

  const { data: pub } = admin.storage.from('media').getPublicUrl(path)
  return { ok: true, url: pub.publicUrl }
}
