'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * Abonne la vue aux changements Postgres (INSERT/UPDATE/DELETE) d'une ou
 * plusieurs tables et rafraîchit les données du Server Component à chaque
 * événement — donne un comportement « temps réel » partagé entre utilisateurs.
 *
 * Prérequis côté Supabase : les tables doivent être dans la publication
 * `supabase_realtime` (voir supabase_realtime.sql).
 */
export function useRealtime(tables: string | string[]) {
  const router = useRouter()
  const key = Array.isArray(tables) ? tables.join(',') : tables

  useEffect(() => {
    const supabase = createClient()
    const list = key.split(',')
    const channel = supabase.channel(`rt-${key}`)
    for (const table of list) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        router.refresh()
      })
    }
    channel.subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [key, router])
}
