import { Card } from '@/components/ui'
import { Icons } from '@/components/Icons'
import { fmtFileSize } from '@/lib/format'
import type { AcademyFormation } from '@/lib/types'

/**
 * Rendu d'une formation (sous-titre + chapitres numérotés + pièces jointes).
 * Partagé par la page du panel et la page publique `/formation`, pour que le
 * contenu s'affiche à l'identique des deux côtés.
 */
export default function FormationReader({ formation }: { formation: AcademyFormation }) {
  return (
    <>
      {formation.subtitle && (
        <div style={{ color: 'var(--ink-400)', fontStyle: 'italic', margin: '-8px 0 16px' }}>
          {formation.subtitle}
        </div>
      )}
      <div style={{ display: 'grid', gap: 14 }}>
        {formation.chapters.map((c, i) => (
          <Card key={c.key} className="card-pad">
            <div style={{ display: 'flex', gap: 12, alignItems: 'baseline', marginBottom: 8 }}>
              <span style={{ color: 'var(--gold-400)', fontFamily: 'var(--font-display)', fontSize: 14 }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--ink-100)' }}>
                {c.title}
              </h4>
            </div>
            {c.text && <p style={{ color: 'var(--ink-300)', fontSize: 13.5, lineHeight: 1.7 }}>{c.text}</p>}
            {c.items.length > 0 && (
              <ul style={{ listStyle: 'none', display: 'grid', gap: 6, marginTop: c.text ? 10 : 0 }}>
                {c.items.map((it, k) => (
                  <li key={k} style={{ color: 'var(--ink-300)', fontSize: 13.5, display: 'flex', gap: 9 }}>
                    <span style={{ color: 'var(--gold-400)' }}>◆</span> {it}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ))}
        {formation.documents?.length > 0 && (
          <Card className="card-pad">
            <div
              style={{
                fontSize: 11.5,
                fontWeight: 700,
                letterSpacing: 1,
                color: 'var(--gold-300)',
                marginBottom: 10,
              }}
            >
              DOCUMENTS
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {formation.documents.map((d) => (
                <a
                  key={d.key}
                  href={d.url}
                  target="_blank"
                  rel="noreferrer"
                  download={d.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 12px',
                    borderRadius: 9,
                    border: '1px solid var(--navy-line-soft)',
                    background: 'var(--navy-800)',
                    color: 'var(--ink-200)',
                    fontSize: 13.5,
                  }}
                >
                  <Icons.file size={15} style={{ color: 'var(--gold-400)', flex: '0 0 15px' }} />
                  <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {d.name}
                  </span>
                  <span style={{ fontSize: 11.5, color: 'var(--ink-500)', whiteSpace: 'nowrap' }}>
                    {fmtFileSize(d.size)}
                  </span>
                  <Icons.download size={15} style={{ color: 'var(--ink-400)', flex: '0 0 15px' }} />
                </a>
              ))}
            </div>
          </Card>
        )}

        {formation.chapters.length === 0 && !formation.documents?.length && (
          <Card style={{ textAlign: 'center', color: 'var(--ink-500)', padding: 30 }}>
            Cette formation n&apos;a pas encore de contenu.
          </Card>
        )}
      </div>
    </>
  )
}
