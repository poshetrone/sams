'use server'
import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentMember } from '@/lib/auth'
import { logAudit } from '@/lib/actions/audit'
import type { Wounded, Fusillade } from '@/lib/types'

type Result = { ok: boolean; error?: string; id?: string }

const stamp = () => {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`
}
const todayFull = () => {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`
}

export interface FusilladeInput {
  title: string
  zone: string
  x: number | null
  y: number | null
  severity: string
}

export async function createFusillade(input: FusilladeInput): Promise<Result> {
  const me = await getCurrentMember()
  if (!me) return { ok: false, error: 'Non authentifié' }
  if (!input.title.trim() || input.x == null) return { ok: false, error: 'Titre et position requis' }
  const admin = createServiceClient()
  const { error } = await admin.from('fusillades').insert({
    title: input.title.trim(), zone: input.zone || null, x: input.x, y: input.y,
    severity: input.severity, status: 'en cours', time: stamp(), author: me.name, wounded: [],
  })
  if (error) return { ok: false, error: error.message }
  await logAudit(me, 'a déclenché une fusillade', input.zone || input.title.trim())
  revalidatePath('/fusillades')
  return { ok: true }
}

/** Met à jour le statut et/ou les blessés d'une fusillade. */
export async function updateFusillade(id: string, patch: Partial<Pick<Fusillade, 'status' | 'wounded'>>): Promise<Result> {
  const me = await getCurrentMember()
  if (!me) return { ok: false, error: 'Non authentifié' }
  const admin = createServiceClient()
  const { error } = await admin.from('fusillades').update(patch).eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/fusillades')
  return { ok: true }
}

/** Crée un dossier patient depuis un blessé et le lie à la fusillade. */
export async function createPatientFromWounded(fusId: string, w: Wounded): Promise<Result> {
  const me = await getCurrentMember()
  if (!me) return { ok: false, error: 'Non authentifié' }
  const admin = createServiceClient()

  const [first, ...rest] = (w.name || 'Inconnu').split(' ')
  const patient = {
    first_name: first, last_name: rest.join(' ') || '', dob: '', sex: w.sex || 'M', blood: 'O+',
    phone: w.phone || '', matricule: 'CIT-' + Math.floor(10000 + Math.random() * 89999),
    photo: w.photo || null, id_card: w.idCard || null, allergies: 'Aucune connue',
    status: w.triage === 'deces' ? 'deces' : 'critique', care: 'admis', room: '', last_visit: todayFull(),
    notes: `Admis suite à fusillade. Groupe : ${w.group || '—'}.`,
    emergency: { name: '', link: '', phone: '' },
    vitals: { tension: '12/8', fc: '90', spo2: '95', temp: '37.2' },
    vitals_history: [{ date: todayFull().slice(0, 5), tension: '12/8', fc: '90', spo2: '95', temp: '37.2' }],
    antecedents: '', treatments: [],
    history: [{ date: stamp(), type: 'Admission', author: me.name, text: w.info || 'Blessé par balle, admis aux urgences.' }],
    appointments: [], images: [], invoices: [], docs: [],
  }
  const { data: created, error } = await admin.from('patients').insert(patient).select('id').single()
  if (error) return { ok: false, error: error.message }

  // Lie le blessé au dossier créé
  const { data: fus } = await admin.from('fusillades').select('wounded').eq('id', fusId).maybeSingle()
  if (fus) {
    const wounded = ((fus.wounded as Wounded[]) || []).map((x) => (x.id === w.id ? { ...x, patientId: created.id } : x))
    await admin.from('fusillades').update({ wounded }).eq('id', fusId)
  }
  await logAudit(me, 'a créé un dossier patient depuis une fusillade —', w.name)
  revalidatePath('/fusillades')
  revalidatePath('/patients')
  return { ok: true, id: created.id }
}
