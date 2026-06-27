'use server'
import { apiPost } from '@/lib/api/client'

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
  const res = await apiPost('/media', { folder, fileName, mime, dataUrl })
  return res
}
