'use client'
import { useState } from 'react'
import { Icons } from '@/components/Icons'
import { Badge, Card, SecTitle } from '@/components/ui'
import { fmtMoney } from '@/lib/format'
import { MUTUELLES } from '@/lib/constants'
import { useApp } from '@/lib/app-context'
import { FactureModal } from './modals'
import { FactureCard } from './cards'
import type { Patient, Invoice, PatientPatch } from '@/lib/types'

export default function PatientBilling({
  patient,
  persist,
}: {
  patient: Patient
  persist: (patch: PatientPatch) => void
}) {
  const { can, isAdmin } = useApp()
  const [modal, setModal] = useState(false)
  const [card, setCard] = useState<Invoice | null>(null)
  const invoices = patient.invoices || []
  const total = invoices.reduce((s, i) => s + i.amount, 0)
  const due = invoices.filter((i) => i.status !== 'payée').reduce((s, i) => s + i.amount, 0)
  const allowed = can('billing')

  const add = (inv: Invoice) => persist({ invoices: [inv, ...invoices] })
  const del = (id: string) => persist({ invoices: invoices.filter((i) => i.id !== id) })

  return (
    <div className="view-anim">
      <SecTitle action={allowed ? <button className="btn btn-gold" onClick={() => setModal(true)}><Icons.plus size={14} /> Nouvelle facture</button> : undefined}>
        Facturation
      </SecTitle>
      <div style={{ display: 'flex', gap: 16, marginBottom: 18 }}>
        <Card className="card-pad" style={{ flex: 1 }}>
          <div className="label" style={{ fontSize: 12, color: 'var(--ink-400)', fontWeight: 600 }}>Total facturé</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 600, color: 'var(--ink-100)' }}>{fmtMoney(total)}</div>
        </Card>
        <Card className="card-pad" style={{ flex: 1 }}>
          <div className="label" style={{ fontSize: 12, color: 'var(--ink-400)', fontWeight: 600 }}>Reste à régler</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 600, color: due > 0 ? 'var(--crit)' : 'var(--ok)' }}>{fmtMoney(due)}</div>
        </Card>
      </div>
      <Card>
        {invoices.length === 0 && (
          <p style={{ color: 'var(--ink-500)', fontSize: 13.5, padding: 30, textAlign: 'center' }}>
            Aucune facture.{allowed ? " Créez-en une, reliée à la mutuelle de l'entreprise." : ''}
          </p>
        )}
        {invoices.map((inv) => {
          const mut = inv.mutuelle ? MUTUELLES[inv.mutuelle as 'standard' | 'premium'] : null
          return (
            <div className="doc-row" key={inv.id}>
              <div className="dr-ico"><Icons.coin size={19} /></div>
              <div className="dr-i"><b>{inv.label}</b><span>{inv.date}{mut ? ` · ${mut.label}` : ''}</span></div>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, color: 'var(--gold-300)' }}>{fmtMoney(inv.amount)}</span>
              <Badge cls={inv.status === 'payée' ? 'ok' : 'warn'}>{inv.status}</Badge>
              <div className="icon-btn" style={{ width: 34, height: 34 }} title="Facture PNG" onClick={() => setCard(inv)}><Icons.download size={16} /></div>
              {isAdmin && <div className="icon-btn" style={{ width: 34, height: 34 }} title="Supprimer (Direction)" onClick={() => del(inv.id)}><Icons.trash size={15} /></div>}
            </div>
          )
        })}
      </Card>
      {modal && <FactureModal onClose={() => setModal(false)} onSave={add} />}
      {card && <FactureCard patient={patient} inv={card} onClose={() => setCard(null)} />}
    </div>
  )
}
