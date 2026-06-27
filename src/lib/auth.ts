import { supabase } from './supabase'

export type UserRole = 'super_admin' | 'admin' | 'colaborador'

export interface Profile {
  id: string
  empresa_id: string | null
  nome: string | null
  email: string | null
  role: UserRole
}

export interface AuthState {
  userId: string | null
  profile: Profile | null
}

/**
 * Lê a sessão atual e o perfil em `usuarios`.
 * Trata "sem sessão" e "sem perfil" sem nunca travar em loading.
 */
export async function getAuthState(): Promise<AuthState> {
  const { data } = await supabase.auth.getSession()
  const session = data.session
  if (!session) return { userId: null, profile: null }

  const { data: profile } = await supabase
    .from('usuarios')
    .select('id, empresa_id, nome, email, role')
    .eq('id', session.user.id)
    .maybeSingle()

  return { userId: session.user.id, profile: (profile as Profile | null) ?? null }
}

export function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password })
}

export function signUp(email: string, password: string, nome: string) {
  return supabase.auth.signUp({ email, password, options: { data: { nome } } })
}

export function signOut() {
  return supabase.auth.signOut()
}
