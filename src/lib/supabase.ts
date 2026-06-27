import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? ''
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? ''

if (!supabaseUrl || !supabaseAnonKey) {
  // Em dev e na Vercel, defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.
  // Os placeholders abaixo só existem para o build/prerender não quebrar;
  // sem as chaves reais, o app não conecta no banco em tempo de execução.
  console.warn('[Supabase] VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não definidos.')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
)
