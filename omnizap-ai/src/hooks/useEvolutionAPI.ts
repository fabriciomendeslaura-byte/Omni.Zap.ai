import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
  createInstance,
  getQRCode,
  getConnectionState,
  logoutInstance,
  deleteInstance,
  setWebhook,
} from '../lib/evolutionApi';

export type ConnectionStatus = 'idle' | 'creating' | 'qr_ready' | 'connected' | 'disconnected' | 'error';

export interface EvolutionState {
  status: ConnectionStatus;
  qrCodeBase64: string | null;
  numero: string | null;
  error: string | null;
}

const POLLING_INTERVAL_MS = 3000; // verifica estado a cada 3s após QR exibido

export function useEvolutionAPI(userId: string | undefined) {
  const [state, setState] = useState<EvolutionState>({
    status: 'idle',
    qrCodeBase64: null,
    numero: null,
    error: null,
  });

  const [pollingTimer, setPollingTimer] = useState<ReturnType<typeof setInterval> | null>(null);

  // ── Para o polling ──────────────────────────────────────────
  const stopPolling = useCallback(() => {
    setPollingTimer(prev => {
      if (prev) clearInterval(prev);
      return null;
    });
  }, []);

  // ── Atualiza banco quando conectado ────────────────────────
  const saveConnectionToDB = useCallback(async (numero: string) => {
    if (!userId) return;
    await supabase
      .from('whatsapp_connections')
      .upsert(
        [{
          user_id:    userId,
          session_id: userId,
          numero,
          status:     'connected',
          api_status: 'open',
          last_activity: new Date().toISOString(),
        }],
        { onConflict: 'user_id' }
      );
  }, [userId]);

  // ── Polling: verifica se escaneou o QR ─────────────────────
  const startPolling = useCallback((onConnected: (numero: string) => void) => {
    if (!userId) return;

    const timer = setInterval(async () => {
      try {
        const result = await getConnectionState(userId);
        const instanceState = result?.instance?.state;

        if (instanceState === 'open') {
          stopPolling();

          // Busca o número conectado no banco (Evolution atualiza via webhook)
          // Fallback: busca no banco após 2s
          setTimeout(async () => {
            const { data } = await supabase
              .from('whatsapp_connections')
              .select('numero')
              .eq('session_id', userId)
              .single();

            const numero = data?.numero || '';
            setState(prev => ({ ...prev, status: 'connected', numero, qrCodeBase64: null }));
            onConnected(numero);
          }, 2000);
        }
      } catch {
        // ignora erros de polling silenciosamente
      }
    }, POLLING_INTERVAL_MS);

    setPollingTimer(timer);
  }, [userId, stopPolling]);

  // ── Inicia conexão + exibe QR ───────────────────────────────
  const connect = useCallback(async () => {
    if (!userId) return;

    setState({ status: 'creating', qrCodeBase64: null, numero: null, error: null });

    try {
      // 1. Cria a instância (ignora erro se já existir)
      try {
        await createInstance(userId);
      } catch (e: any) {
        // Se a instância já existe, continua normalmente
        if (!e.message?.includes('already')) throw e;
      }

      // 2. Salva no banco como "connecting"
      await supabase
        .from('whatsapp_connections')
        .upsert(
          [{
            user_id:    userId,
            session_id: userId,
            status:     'connecting',
            api_status: 'qr_pending',
            last_activity: new Date().toISOString(),
          }],
          { onConflict: 'user_id' }
        );

      // 3. Busca QR Code
      const qr = await getQRCode(userId);
      const qrBase64 = qr.base64 || `data:image/png;base64,${qr.code}`;

      setState({ status: 'qr_ready', qrCodeBase64: qrBase64, numero: null, error: null });

      // 4. Inicia polling para detectar scan
      startPolling((numero) => {
        saveConnectionToDB(numero);
      });

    } catch (e: any) {
      setState(prev => ({ ...prev, status: 'error', error: e.message }));
    }
  }, [userId, startPolling, saveConnectionToDB]);

  // ── Atualiza QR (se expirou) ────────────────────────────────
  const refreshQR = useCallback(async () => {
    if (!userId) return;
    try {
      const qr = await getQRCode(userId);
      const qrBase64 = qr.base64 || `data:image/png;base64,${qr.code}`;
      setState(prev => ({ ...prev, qrCodeBase64: qrBase64, error: null }));
    } catch (e: any) {
      setState(prev => ({ ...prev, error: e.message }));
    }
  }, [userId]);

  // ── Desconecta ──────────────────────────────────────────────
  const disconnect = useCallback(async () => {
    if (!userId) return;
    stopPolling();

    try {
      await logoutInstance(userId);
    } catch {
      // ignora se já estava desconectado
    }

    await supabase
      .from('whatsapp_connections')
      .update({ status: 'disconnected', api_status: 'close' })
      .eq('session_id', userId);

    setState({ status: 'disconnected', qrCodeBase64: null, numero: null, error: null });
  }, [userId, stopPolling]);

  // ── Deleta instância completamente ─────────────────────────
  const deleteConnection = useCallback(async () => {
    if (!userId) return;
    stopPolling();

    try {
      await deleteInstance(userId);
    } catch {
      // ignora
    }

    await supabase
      .from('whatsapp_connections')
      .delete()
      .eq('user_id', userId);

    setState({ status: 'idle', qrCodeBase64: null, numero: null, error: null });
  }, [userId, stopPolling]);

  // ── Configura webhook na Evolution API ─────────────────────
  const configureWebhook = useCallback(async (webhookUrl: string) => {
    if (!userId) return;
    try {
      await setWebhook(userId, webhookUrl);
      await supabase
        .from('whatsapp_connections')
        .update({ webhook_url: webhookUrl })
        .eq('session_id', userId);
    } catch (e: any) {
      setState(prev => ({ ...prev, error: e.message }));
    }
  }, [userId]);

  return {
    state,
    connect,
    disconnect,
    deleteConnection,
    refreshQR,
    configureWebhook,
  };
}
