/* ============ SAMS — Helpers de formatage (portés depuis data.js) ============ */

/** Format monétaire — ex : 65 000 $ (espaces insécables). */
export const fmtMoney = (n: number | string | null | undefined): string => {
  const v = typeof n === 'number' ? n : Number(n || 0)
  return v.toLocaleString('fr-FR').replace(/ /g, ' ') + ' $'
}

/** Format téléphone : (xxx) xxx-xxxx */
export const fmtPhone = (v: string | number | null | undefined): string => {
  const d = (v == null ? '' : String(v)).replace(/\D/g, '').slice(0, 10)
  if (!d) return ''
  if (d.length <= 3) return '(' + d
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
}

/** Initiales (max 2 lettres) à partir d'un nom complet. */
export const initialsOf = (name: string): string =>
  (name || '')
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
