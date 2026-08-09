import "server-only";
import { cookies } from "next/headers";
import type { Page, PageMeta } from "@/lib/types";

/**
 * Client API serveur — remplace les clients Supabase.
 *
 * Toutes les lectures (Server Components) et écritures (Server Actions)
 * passent par l'API AdonisJS (api-sams). Le token d'accès Discord est stocké
 * dans un cookie httpOnly (`sams_token`) posé au callback OAuth et rejoué ici
 * en `Authorization: Bearer`.
 */
export const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333")
  .replace(/\/$/, "")
  // Appels SERVEUR → API : forcer l'IPv4. Le `fetch` de Node résout `localhost`
  // en IPv6 (`::1`) en premier, alors qu'Adonis écoute en IPv4 → ECONNREFUSED.
  // Le navigateur (login/SSE) n'est pas concerné (constante séparée).
  .replace("localhost", "127.0.0.1");
export const TOKEN_COOKIE = "sams_token";

function authHeaders(): Record<string, string> {
  const raw = cookies().get(TOKEN_COOKIE)?.value;
  if (!raw) return {};
  // Next encode la valeur du cookie à l'écriture mais ne la décode pas
  // toujours à la lecture → on normalise (un token oat_ ne contient pas de
  // '%' littéral, donc decodeURIComponent est sûr ; no-op si déjà décodé).
  let token = raw;
  try {
    token = decodeURIComponent(raw);
  } catch {
    /* valeur non encodée : on garde brut */
  }
  return { Authorization: `Bearer ${token}` };
}

async function request(
  method: string,
  path: string,
  body?: unknown,
): Promise<Response> {
  return fetch(`${API_BASE}/api/v1${path}`, {
    credentials: "include",
    method,
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
}

/** Lecture : renvoie le `data` déballé, ou `null` (non authentifié / erreur). */
export async function apiGet<T = unknown>(path: string): Promise<T | null> {
  let res: Response;
  try {
    res = await request("GET", path);
  } catch {
    // API injoignable / non authentifié.
    return null;
  }
  if (!res.ok) return null;
  const json = await res.json().catch(() => null);
  if (json && typeof json === "object" && "data" in json)
    return (json as { data: T }).data;
  return json as T;
}

/**
 * Lecture paginée : déballe `{ data, metadata }`. Renvoie une page vide plutôt
 * que `null` pour que l'appelant puisse rendre la vue sans cas particulier.
 */
export async function apiGetPage<T = unknown>(
  path: string,
  perPageFallback = 10,
): Promise<Page<T>> {
  const empty: Page<T> = {
    items: [],
    meta: { total: 0, perPage: perPageFallback, currentPage: 1, lastPage: 1 },
  };

  let res: Response;
  try {
    res = await request("GET", path);
  } catch {
    return empty;
  }
  if (!res.ok) return empty;

  const json = (await res.json().catch(() => null)) as {
    data?: T[];
    metadata?: Partial<PageMeta>;
  } | null;
  if (!json || !Array.isArray(json.data)) return empty;

  const m = json.metadata ?? {};
  return {
    items: json.data,
    meta: {
      total: Number(m.total ?? json.data.length),
      perPage: Number(m.perPage ?? perPageFallback),
      currentPage: Number(m.currentPage ?? 1),
      lastPage: Math.max(1, Number(m.lastPage ?? 1)),
    },
  };
}

export interface MutationResult {
  ok: boolean;
  error?: string;
  [key: string]: unknown;
}

async function mutate(
  method: string,
  path: string,
  body?: unknown,
): Promise<MutationResult> {
  let res: Response;
  try {
    res = await request(method, path, body);
  } catch (e) {
    return { ok: false, error: (e as Error).message || "Erreur réseau" };
  }
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    return {
      ok: false,
      error:
        (json.error as string) ||
        (json.message as string) ||
        `Erreur ${res.status}`,
    };
  }
  return { ok: true, ...json };
}

export const apiPost = (path: string, body?: unknown) =>
  mutate("POST", path, body);
export const apiPut = (path: string, body?: unknown) =>
  mutate("PUT", path, body);
export const apiPatch = (path: string, body?: unknown) =>
  mutate("PATCH", path, body);
export const apiDelete = (path: string, body?: unknown) =>
  mutate("DELETE", path, body);
