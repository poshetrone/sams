'use client'

/** Capture l'élément DOM `elId` et renvoie un data URL PNG (ou null). */
export async function capturePng(elId: string): Promise<string | null> {
  const el = document.getElementById(elId)
  if (!el) return null
  try {
    const html2canvas = (await import('html2canvas')).default
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#fbf9f4', useCORS: true, logging: false })
    return canvas.toDataURL('image/png')
  } catch {
    return null
  }
}

/** Exporte l'élément DOM `elId` en PNG via html2canvas (import dynamique). */
export async function exportPng(elId: string, filename: string, flash?: (m: string) => void) {
  const el = document.getElementById(elId)
  if (!el) {
    flash?.('Export indisponible')
    return
  }
  flash?.('Génération du PNG…')
  try {
    const html2canvas = (await import('html2canvas')).default
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#fbf9f4', useCORS: true, logging: false })
    const link = document.createElement('a')
    link.download = filename + '.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
    flash?.('Téléchargé en PNG ✓')
  } catch {
    flash?.('Erreur export')
  }
}
