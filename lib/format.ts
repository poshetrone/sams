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

/* ============================================================
 * Fuseau horaire — on stocke l'instant en UTC (timestamptz) et on
 * AFFICHE TOUJOURS en Europe/Paris. `Intl` gère seul le passage
 * heure d'été / heure d'hiver, sans dépendance externe.
 * Module isomorphe (utilisable client + serveur).
 * ============================================================ */
export const PARIS_TZ = 'Europe/Paris'

const pad2 = (n: number) => String(n).padStart(2, '0')
const toDate = (d: Date | string | number): Date => (d instanceof Date ? d : new Date(d))

/** Composantes (année, mois, jour, heure…) d'un instant, lues en heure de Paris. */
function parisParts(d: Date) {
  const f = new Intl.DateTimeFormat('en-GB', {
    timeZone: PARIS_TZ, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
  const m: Record<string, string> = {}
  for (const p of f.formatToParts(d)) if (p.type !== 'literal') m[p.type] = p.value
  return {
    year: +m.year, month: +m.month, day: +m.day,
    hour: +m.hour, minute: +m.minute, second: +m.second,
  }
}

/** "HH:MM" d'un instant, en heure de Paris. */
export const parisHM = (d: Date | string | number): string => {
  const p = parisParts(toDate(d))
  return `${pad2(p.hour)}:${pad2(p.minute)}`
}

/** "DD/MM/YYYY" d'un instant, en date de Paris. */
export const parisDate = (d: Date | string | number): string => {
  const p = parisParts(toDate(d))
  return `${pad2(p.day)}/${pad2(p.month)}/${p.year}`
}

/** Décalage (ms) Europe/Paris − UTC à l'instant `d`. */
function parisOffsetMs(d: Date): number {
  const p = parisParts(d)
  const asUTC = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
  return asUTC - d.getTime()
}

/**
 * Convertit une heure « murale » de Paris (jour + heure) en instant UTC.
 * Gère le changement d'heure été/hiver via le décalage réel à cette date.
 * Sert aux corrections manuelles d'horaires (heure saisie = heure de Paris).
 */
export function parisWallToInstant(
  year: number, month: number, day: number, hour: number, minute: number
): Date {
  const guess = Date.UTC(year, month - 1, day, hour, minute)
  const off = parisOffsetMs(new Date(guess))
  let inst = guess - off
  const off2 = parisOffsetMs(new Date(inst))
  if (off2 !== off) inst = guess - off2 // affine sur les bornes de changement d'heure
  return new Date(inst)
}
