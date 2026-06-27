'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Transmit } from '@adonisjs/transmit-client'

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333').replace(/\/$/, '')

/**
 * Abonne la vue aux changements d'une ou plusieurs tables via les Server-Sent
 * Events de l'API (@adonisjs/transmit) et rafraîchit les données du Server
 * Component à chaque événement — comportement « temps réel » partagé entre
 * utilisateurs. Remplace les channels Supabase.
 *
 * Côté API : chaque écriture diffuse sur le canal `rt:<table>` (BroadcastService).
 */
export function useRealtime(tables: string | string[]) {
  const router = useRouter()
  const key = Array.isArray(tables) ? tables.join(',') : tables

  useEffect(() => {
    const transmit = new Transmit({ baseUrl: API_BASE })
    const list = key.split(',')
    const subs = list.map((table) => transmit.subscription(`rt:${table}`))

    Promise.all(
      subs.map(async (sub) => {
        await sub.create()
        sub.onMessage(() => router.refresh())
      })
    ).catch(() => {})

    return () => {
      subs.forEach((sub) => sub.delete().catch(() => {}))
      transmit.close()
    }
  }, [key, router])
}
