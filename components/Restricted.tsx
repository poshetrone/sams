import { Icons } from './Icons'

/** Écran « Accès restreint » pour les routes réservées à la Direction. */
export default function Restricted({ children }: { children?: React.ReactNode }) {
  return (
    <div className="placeholder-view view-anim">
      <div className="pv-ico"><Icons.lock size={28} /></div>
      <h3>Accès restreint</h3>
      <p>{children || 'Section réservée à la Direction (Directeur, Co-Directeur, Direction Générale).'}</p>
    </div>
  )
}
