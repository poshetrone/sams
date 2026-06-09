'use client'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, SecTitle } from '@/components/ui'
import { Icons } from '@/components/Icons'
import { GRADES, type GradeKey } from '@/lib/constants'
import {
  CATEGORIES,
  getAccess,
  permKey,
  isDirection,
  type AccessLevel,
  type PermMap,
} from '@/lib/permissions'
import { savePermissions } from '@/lib/actions/permissions'

const LEVELS: { value: AccessLevel; label: string; cls: string }[] = [
  { value: 'edit', label: 'Édition', cls: 'ok' },
  { value: 'view', label: 'Lecture', cls: 'info' },
  { value: 'none', label: 'Aucun', cls: 'crit' },
]

const levelColor: Record<AccessLevel, string> = {
  edit: '#45b98a',
  view: '#5aa0d6',
  none: '#e85c52',
}

// Grades en colonnes, ordonnés par rang croissant.
const GRADE_COLS = (Object.keys(GRADES) as GradeKey[]).sort(
  (a, b) => GRADES[a].rank - GRADES[b].rank
)

export default function PermissionsView({
  perms,
  readOnly,
}: {
  perms: PermMap
  readOnly: boolean
}) {
  const router = useRouter()

  // État local : on part des niveaux EFFECTIFS (défaut résolu) pour chaque cellule.
  const initial = useMemo(() => {
    const m: PermMap = {}
    for (const cat of CATEGORIES) {
      for (const g of GRADE_COLS) {
        m[permKey(g, cat.key)] = getAccess(perms, g, cat.key)
      }
    }
    return m
  }, [perms])

  const [matrix, setMatrix] = useState<PermMap>(initial)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const dirty = useMemo(
    () => GRADE_COLS.some((g) => CATEGORIES.some((c) => matrix[permKey(g, c.key)] !== initial[permKey(g, c.key)])),
    [matrix, initial]
  )

  const flash = (m: string) => {
    setToast(m)
    setTimeout(() => setToast(null), 2600)
  }

  // Garde-fou : la Direction ne peut pas se retirer la page Permissions.
  const isLocked = (grade: string, category: string) =>
    category === 'permissions' && isDirection(grade)

  const setCell = (grade: string, category: string, level: AccessLevel) => {
    if (readOnly || isLocked(grade, category)) return
    setMatrix((m) => ({ ...m, [permKey(grade, category)]: level }))
  }

  const save = async () => {
    setBusy(true)
    const rows = GRADE_COLS.flatMap((g) =>
      CATEGORIES.map((c) => ({ grade: g, category: c.key, level: matrix[permKey(g, c.key)] }))
    )
    const res = await savePermissions(rows)
    setBusy(false)
    if (res.ok) {
      flash('Permissions enregistrées')
      router.refresh()
    } else {
      flash(res.error || 'Erreur lors de l’enregistrement')
    }
  }

  const reset = () => setMatrix(initial)

  return (
    <div className="view-anim">
      <SecTitle
        action={
          !readOnly ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost" onClick={reset} disabled={busy || !dirty}>
                Réinitialiser
              </button>
              <button className="btn btn-gold" onClick={save} disabled={busy || !dirty}>
                {busy ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          ) : null
        }
      >
        Matrice des permissions — droits par grade et par catégorie
      </SecTitle>

      <Card className="card-pad">
        <p style={{ color: 'var(--ink-400)', fontSize: 12, margin: '0 0 14px' }}>
          <b>Édition</b> : accès complet (lecture + écriture). <b>Lecture</b> : contenu visible,
          actions d’écriture masquées. <b>Aucun</b> : la catégorie disparaît de la barre latérale et
          la page devient inaccessible. La Direction conserve toujours l’accès à cette page.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table className="tbl perm-matrix" style={{ minWidth: 720 }}>
            <thead>
              <tr>
                <th style={{ position: 'sticky', left: 0, background: 'var(--surface, #161a22)', zIndex: 2, textAlign: 'left' }}>
                  Catégorie
                </th>
                {GRADE_COLS.map((g) => (
                  <th key={g} style={{ whiteSpace: 'nowrap', color: GRADES[g].color, fontSize: 11 }}>
                    {GRADES[g].label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CATEGORIES.map((cat) => (
                <tr key={cat.key}>
                  <td
                    style={{
                      position: 'sticky',
                      left: 0,
                      background: 'var(--surface, #161a22)',
                      zIndex: 1,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <b style={{ color: 'var(--ink-100)' }}>{cat.label}</b>
                    <span style={{ display: 'block', color: 'var(--ink-500)', fontSize: 10 }}>{cat.group}</span>
                  </td>
                  {GRADE_COLS.map((g) => {
                    const k = permKey(g, cat.key)
                    const lvl = matrix[k] as AccessLevel
                    const locked = isLocked(g, cat.key)
                    return (
                      <td key={g} style={{ textAlign: 'center' }}>
                        <select
                          className="perm-cell"
                          value={lvl}
                          disabled={readOnly || locked}
                          onChange={(e) => setCell(g, cat.key, e.target.value as AccessLevel)}
                          title={locked ? 'Verrouillé : la Direction garde toujours cet accès' : undefined}
                          style={{
                            color: levelColor[lvl],
                            borderColor: levelColor[lvl] + '55',
                            background: levelColor[lvl] + '14',
                            fontWeight: 600,
                            fontSize: 11,
                            padding: '4px 6px',
                            borderRadius: 7,
                            borderWidth: 1,
                            borderStyle: 'solid',
                            cursor: readOnly || locked ? 'not-allowed' : 'pointer',
                            opacity: locked ? 0.7 : 1,
                          }}
                        >
                          {LEVELS.map((l) => (
                            <option key={l.value} value={l.value} style={{ color: '#111' }}>
                              {l.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {toast && (
        <div
          style={{
            position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
            background: 'var(--navy-600)', border: '1px solid var(--gold-glow)', color: 'var(--gold-300)',
            padding: '12px 22px', borderRadius: 12, fontSize: 13.5, fontWeight: 600, zIndex: 90,
            boxShadow: 'var(--shadow-pop)', display: 'inline-flex', alignItems: 'center', gap: 8,
          }}
        >
          <Icons.shield size={15} /> {toast}
        </div>
      )}
    </div>
  )
}
