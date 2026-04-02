import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Appointment } from '../types';


export function useAppointments(userId: string | undefined) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = useCallback(async () => {
    try {
      if (!userId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', userId)
        .order('data_agendamento', { ascending: true })
        .order('hora_agendamento', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);


  useEffect(() => {
    fetchAppointments();

    if (!userId) return;

    const channel = supabase
      .channel('public:appointments')

      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments', filter: `user_id=eq.${userId}` }, () => {
        fetchAppointments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchAppointments]);

  const updateAppointmentStatus = async (id: string, status: Appointment['status']) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating appointment format:', error);
      return false;
    }
  };

  const createAppointment = async (apptData: Partial<Appointment>) => {
    if (!userId) return null;
    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert([{ ...apptData, user_id: userId }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating appointment:', error);
      return null;
    }
  };

  return { appointments, loading, updateAppointmentStatus, createAppointment, refetch: fetchAppointments };
}
