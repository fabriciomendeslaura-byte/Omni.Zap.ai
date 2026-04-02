import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL ou Anon Key ausente do arquivo .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Chave de storage personalizada para evitar conflitos com outros apps Supabase no mesmo domínio
    storageKey: 'omnizap-auth-token',
    // Usar localStorage nativo para evitar deadlock de lock
    storage: {
      getItem: (key: string) => {
        try {
          return window.localStorage.getItem(key);
        } catch {
          return null;
        }
      },
      setItem: (key: string, value: string) => {
        try {
          window.localStorage.setItem(key, value);
        } catch {
          // ignore
        }
      },
      removeItem: (key: string) => {
        try {
          window.localStorage.removeItem(key);
        } catch {
          // ignore
        }
      },
    },
    // Desabilitar o lock assíncrono interno fornecendo um dummy lock
    lock: async (...args: any[]) => {
      // O último argumento é a função 'acquire/callback'
      const cb = args[args.length - 1];
      if (typeof cb === 'function') {
        return await cb();
      }
      return null;
    }
  },


  global: {
    // Timeout de 8 segundos para requisições HTTP
    fetch: (url: RequestInfo | URL, options?: RequestInit) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      return fetch(url, { ...options, signal: controller.signal }).finally(() =>
        clearTimeout(timeout)
      );
    },
  },
});
