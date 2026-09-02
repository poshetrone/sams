'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Icons } from '@/components/Icons'
import { Card, SecTitle } from '@/components/ui'
import FormationReader from './FormationReader'
import type { AcademyFormation } from '@/lib/types'

/**
 * Parcours SAMS Academy en accès libre : une recrue peut se former avant
 * d'avoir ses accès. Lecture seule — la validation des étapes et les réponses
 * demandent un compte, et se font depuis le panel.
 */
export default function PublicAcademy({ formations }: { formations: AcademyFormation[] }) {
  const [open, setOpen] = useState(0)
  const current = formations[open]

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: '32px 24px 60px' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28, flexWrap: 'wrap' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/sams-logo.png" alt="SAMS" style={{ width: 46, height: 46 }} />
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: 'var(--ink-100)', lineHeight: 1.1 }}>
            SAMS Academy
          </h1>
          <p style={{ fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--gold-300)', fontWeight: 600 }}>
            Parcours de formation EMS
          </p>
        </div>
        <Link href="/login" className="btn btn-gold" style={{ marginLeft: 'auto', textDecoration: 'none' }}>
          <Icons.lock size={15} /> Se connecter
        </Link>
      </header>

      {formations.length === 0 ? (
        <Card style={{ textAlign: 'center', color: 'var(--ink-500)', padding: 44 }}>
          Le parcours n&apos;est pas encore publié.
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20, alignItems: 'start' }}>
          <Card style={{ padding: 10 }}>
            {formations.map((f, i) => (
              <div
                key={f.id}
                onClick={() => setOpen(i)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 9,
                  cursor: 'pointer',
                  background: i === open ? 'rgba(201,163,90,0.12)' : 'transparent',
                }}
              >
                <span
                  style={{
                    width: 26,
                    height: 26,
                    flex: '0 0 26px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    border: '1px solid var(--navy-line)',
                    color: 'var(--ink-400)',
                  }}
                >
                  {String(i).padStart(2, '0')}
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: i === open ? 'var(--gold-300)' : 'var(--ink-200)' }}>
                  {f.title}
                </span>
              </div>
            ))}
          </Card>

          <div>
            <SecTitle>{current.title}</SecTitle>
            <FormationReader formation={current} />

            <Card className="card-pad" style={{ marginTop: 18, background: 'var(--navy-800)' }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: 1, color: 'var(--gold-300)', marginBottom: 8 }}>
                VALIDATION DE L&apos;ÉTAPE
              </div>
              <div style={{ color: 'var(--ink-400)', fontSize: 13.5 }}>
                La validation des étapes et les mises en situation demandent un compte.{' '}
                <Link href="/login" style={{ color: 'var(--gold-300)' }}>
                  Connectez-vous
                </Link>{' '}
                pour enregistrer votre progression.
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
