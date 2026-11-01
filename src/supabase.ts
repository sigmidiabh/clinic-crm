import { createClient } from '@supabase/supabase-js';

// Leitura segura das variáveis de ambiente evitando conflitos de tipagem
const env = (import.meta as any).env || {};
const supabaseUrl = env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
