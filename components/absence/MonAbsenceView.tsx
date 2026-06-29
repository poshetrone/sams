'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Icons } from '@/components/Icons'
import { Badge, Card, SecTitle } from '@/components/ui'
import AbsenceFields, { type AbsenceState } from '@/components/absence/AbsenceFields'
import { absenceBadge } from '@/lib/constants'
import { frToInputDate, inputToFrDate } from '@/lib/format'
import { useApp } from '@/lib/app-context'
import { setMyAbsence } from '@/lib/actions/members'
import type { Member } from '@/lib/types'

export default function MonAbsenceView({ member }: { member: Member }) {
  const router = useRouter()
  const { canEdit } = useApp()
  const editable = canEdit('absence')

  const [f, setF] = useState<AbsenceState>({
    absence: member.absence || '',
    reason: member.absence_reason || '',
    until: frToInputDate(member.absence_until),
  })
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const current = absenceBadge(member.absence, member.absence_reason)

  const flash = (m: string) => {
    setToast(m)
    setTimeout(() => setToast(null), 2400)
  }

  const save = async () => {
    setBusy(true)
    const res = await setMyAbsence({
      absence: f.absence || null,
      absence_reason: f.reason,
      absence_until: f.absence ? inputToFrDate(f.until) : null,
    })
    setBusy(false)
    if (res.ok) {
      flash(f.absence ? 'Absence enregistrée' : 'Vous êtes de nouveau noté présent')
      router.refresh()
    } else {
      flash(res.error || 'Erreur')
    }
  }

  const clear = () => {
    setF({ absence: '', reason: '', until: '' })
  }

  return (
    <div className="view-anim" style={{ maxWidth: 720 }}>
      <SecTitle>Statut actuel</SecTitle>
      <Card className="card-pad" style={{ marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="kpi-ico" style={{ position: 'static' }}>
            <Icons.calendar size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: 'var(--ink-400)', marginBottom: 4 }}>{member.name}</div>
            {current ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <Badge cls={current.cls}>{current.label}</Badge>
                {member.absence_until && (
                  <span style={{ fontSize: 12.5, color: 'var(--ink-400)' }}>
                    jusqu&apos;au <b style={{ color: 'var(--ink-200)' }}>{member.absence_until}</b>
                  </span>
                )}
              </div>
            ) : (
              <div style={{ fontSize: 15, color: 'var(--ok)', fontWeight: 600 }}>Présent — aucune absence déclarée</div>
            )}
          </div>
        </div>
      </Card>

      <SecTitle>Déclarer une absence</SecTitle>
      <Card className="card-pad">
        {!editable ? (
          <p style={{ color: 'var(--ink-400)', fontSize: 13.5, lineHeight: 1.6 }}>
            Vous n&apos;avez pas l&apos;autorisation de modifier votre absence. Contactez la Direction.
          </p>
        ) : (
          <div className="editor-panel">
            <p style={{ fontSize: 13, color: 'var(--ink-400)', lineHeight: 1.6, marginBottom: 16 }}>
              Indiquez votre indisponibilité : elle apparaîtra immédiatement dans le suivi de pointage
              et sur votre fiche. Choisissez « Autre… » pour saisir une raison personnalisée.
            </p>

            <AbsenceFields value={f} onChange={setF} />

            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              {f.absence && (
                <button className="btn btn-ghost" onClick={clear} disabled={busy} title="Remettre à présent">
                  <Icons.x size={15} /> Présent
                </button>
              )}
              <button
                className="btn btn-gold"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={save}
                disabled={busy}
              >
                <Icons.check size={15} /> {busy ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        )}
      </Card>

      {toast && (
        <div style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', background: 'var(--navy-600)', border: '1px solid var(--gold-glow)', color: 'var(--gold-300)', padding: '12px 22px', borderRadius: 12, fontSize: 13.5, fontWeight: 600, zIndex: 90, boxShadow: 'var(--shadow-pop)' }}>
          {toast}
        </div>
      )}
    </div>
  )
}
