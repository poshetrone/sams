'use client'

export interface CompressOptions {
  /** Largeur (et hauteur) maximale en pixels. L'image n'est jamais agrandie. */
  maxWidth?: number
  /** Qualité de compression 0–1 (pour WebP/JPEG). */
  quality?: number
  /** Type de sortie. WebP par défaut (conserve la transparence + bonne compression). */
  mime?: 'image/webp' | 'image/jpeg'
}

/**
 * Lit un fichier image, le redimensionne (max ~1000px) et le compresse côté
 * navigateur via un canvas, puis renvoie un data URL léger.
 * À utiliser pour TOUS les uploads d'images avant envoi au serveur.
 */
export async function compressImage(file: File, opts: CompressOptions = {}): Promise<string> {
  const { maxWidth = 1000, quality = 0.8, mime = 'image/webp' } = opts

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = reject
    r.readAsDataURL(file)
  })

  // Les non-images (ex : PDF) sont renvoyées telles quelles.
  if (!file.type.startsWith('image/')) return dataUrl

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image()
    i.onload = () => resolve(i)
    i.onerror = reject
    i.src = dataUrl
  })

  const scale = Math.min(1, maxWidth / Math.max(img.width || 1, img.height || 1))
  const w = Math.max(1, Math.round((img.width || 1) * scale))
  const h = Math.max(1, Math.round((img.height || 1) * scale))

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return dataUrl
  ctx.drawImage(img, 0, 0, w, h)

  const out = canvas.toDataURL(mime, quality)
  // Si le navigateur ne sait pas encoder le mime demandé, il renvoie du PNG ;
  // on garde alors le résultat le plus léger entre l'original et la sortie.
  if (!out.startsWith('data:image')) return dataUrl
  return out.length < dataUrl.length ? out : (mime === 'image/webp' ? out : dataUrl)
}

/**
 * Helper pratique pour un <input type="file">. Compresse puis appelle `cb`
 * avec le data URL. Ignore si aucun fichier.
 */
export async function handleImageInput(
  file: File | undefined | null,
  cb: (dataUrl: string) => void,
  opts?: CompressOptions
): Promise<void> {
  if (!file) return
  try {
    cb(await compressImage(file, opts))
  } catch {
    // En dernier recours, on lit le fichier brut.
    const r = new FileReader()
    r.onload = () => cb(r.result as string)
    r.readAsDataURL(file)
  }
}
