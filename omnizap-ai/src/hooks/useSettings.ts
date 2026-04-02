import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface UserSettings {
  notifications_email: boolean;
  notifications_push: boolean;
  notifications_whatsapp: boolean;
  notifications_system: boolean;
  theme_mode: 'light' | 'dark';
  language: string;
}

export function useSettings(userId: string | undefined) {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      if (!userId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data, error } = await supabase
        .from('profile_settings')
        .select('*')
        .eq('user_id', userId)
        .single();


      if (error) {
        if (error.code === 'PGRST116') {
          // No settings found, create defaults
          const defaults: Partial<UserSettings> = {
            notifications_email: true,
            notifications_push: true,
            notifications_whatsapp: false,
            notifications_system: true,
            theme_mode: 'dark',
            language: 'pt-BR'
          };
          
          const { data: newData, error: insertError } = await supabase
            .from('profile_settings')
            .insert([{ ...defaults, user_id: userId }])
            .select()
            .single();

          if (insertError) throw insertError;
          setSettings(newData);
        } else {
          throw error;
        }
      } else {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchSettings();
    }
  }, [userId, fetchSettings]);

  const updateSettings = async (updates: Partial<UserSettings>) => {
    if (!userId) return false;
    try {
      const { error } = await supabase
        .from('profile_settings')
        .update(updates)
        .eq('user_id', userId);

      if (error) throw error;
      
      setSettings(prev => prev ? { ...prev, ...updates } : null);
      return true;
    } catch (error) {
      console.error('Error updating settings:', error);
      return false;
    }
  };

  return { settings, loading, updateSettings, refetch: fetchSettings };
}
