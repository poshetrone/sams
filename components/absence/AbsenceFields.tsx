'use client'
import { Icons } from '@/components/Icons'
import { ABSENCE_TYPES, ABSENCE_CUSTOM } from '@/lib/constants'

/** État du formulaire d'absence. `until` est au format input date "AAAA-MM-JJ". */
export interface AbsenceState {
  absence: string // '' = présent, clé de ABSENCE_TYPES, ou ABSENCE_CUSTOM
  reason: string
  until: string
}

export const emptyAbsence: AbsenceState = { absence: '', reason: '', until: '' }

/**
 * Sélecteur de motif d'absence (présent / préréglages / autre + raison libre)
 * avec date de fin facultative. Contrôlé : la valeur et le setter viennent du parent.
 */
export default function AbsenceFields({
  value,
  onChange,
}: {
  value: AbsenceState
  onChange: (v: AbsenceState) => void
}) {
  const set = (patch: Partial<AbsenceState>) => onChange({ ...value, ...patch })
  const custom = value.absence === ABSENCE_CUSTOM

  return (
    <>
      <div className="ep-field">
        <label>Motif d&apos;absence</label>
        <div className="chips">
          <div className={`chip ${!value.absence ? 'on' : ''}`} onClick={() => set({ absence: '' })}>
            Présent
          </div>
          {Object.entries(ABSENCE_TYPES).map(([k, def]) => (
            <div key={k} className={`chip ${value.absence === k ? 'on' : ''}`} onClick={() => set({ absence: k })}>
              {value.absence === k && <Icons.check size={12} style={{ verticalAlign: -1, marginRight: 4 }} />}
              {def.label}
            </div>
          ))}
          <div className={`chip ${custom ? 'on' : ''}`} onClick={() => set({ absence: ABSENCE_CUSTOM })}>
            {custom && <Icons.check size={12} style={{ verticalAlign: -1, marginRight: 4 }} />}
            Autre…
          </div>
        </div>
      </div>

      {value.absence && (
        <>
          <div className="ep-field" style={{ marginTop: 14 }}>
            <label>
              Raison{' '}
              {!custom && <span style={{ color: 'var(--ink-500)', fontWeight: 400 }}>(facultatif)</span>}
            </label>
            <input
              value={value.reason}
              onChange={(e) => set({ reason: e.target.value })}
              placeholder={custom ? 'Précisez votre absence…' : 'Détail (optionnel)…'}
              maxLength={120}
            />
          </div>
          <div className="ep-field" style={{ marginTop: 14 }}>
            <label>
              Jusqu&apos;au <span style={{ color: 'var(--ink-500)', fontWeight: 400 }}>(facultatif)</span>
            </label>
            <input type="date" value={value.until} onChange={(e) => set({ until: e.target.value })} />
          </div>
        </>
      )}
    </>
  )
}
