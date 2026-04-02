import { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') {
          console.warn('Erro ao carregar perfil:', error.message);
        }
        setProfile(null);
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error('Falha ao buscar perfil:', err);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Safety net: never hang forever
    const safetyTimer = setTimeout(() => {
      if (mounted && loading) {
        console.warn('Auth safety timeout ativado — desbloqueando UI.');
        setLoading(false);
      }
    }, 6000);

    // Listen to auth state changes first (more reliable than getSession)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          await fetchProfile(currentUser.id);
        } else {
          setProfile(null);
        }

        setLoading(false);
        clearTimeout(safetyTimer);
      }
    );

    // Also call getSession to handle initial load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      // onAuthStateChange will handle this, but if it doesn't fire fast enough:
      if (loading) {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (!currentUser) {
          setLoading(false);
          clearTimeout(safetyTimer);
        }
        // If currentUser exists, wait for onAuthStateChange + fetchProfile
      }
    }).catch(() => {
      if (mounted) {
        setLoading(false);
        clearTimeout(safetyTimer);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const updateProfile = useCallback((newProfileData: any) => {
    setProfile((prev: any) => ({ ...prev, ...newProfileData }));
  }, []);

  return { user, profile, loading, updateProfile, fetchProfile };
}
