// ============================================================
// Evolution API — Serviço de integração WhatsApp
// BASE: https://api.omniiabr.com
// ============================================================

const BASE_URL = 'https://api.omniiabr.com';
const API_KEY  = '7E1AC7D73286-4579-808F-6A7C6B05EE9C';

const headers = {
  'Content-Type': 'application/json',
  'apikey': API_KEY,
};

// ────────────────────────────────────────────────────────────
// Tipos de resposta
// ────────────────────────────────────────────────────────────

export interface EvolutionInstance {
  instance: {
    instanceName: string;
    status: string;
  };
  hash: {
    apikey: string;
  };
}

export interface EvolutionQRCode {
  pairingCode: string | null;
  code: string;       // base64 da imagem QR
  base64: string;     // data:image/png;base64,...
  count: number;
}

export interface EvolutionConnectionState {
  instance: {
    instanceName: string;
    state: 'open' | 'close' | 'connecting';
  };
}

export interface EvolutionSendMessage {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  message: {
    conversation: string;
  };
  messageTimestamp: number;
  status: string;
}

// ────────────────────────────────────────────────────────────
// Funções
// ────────────────────────────────────────────────────────────

/**
 * Cria uma instância WhatsApp para o usuário.
 * instanceName = user_id (padrão para identificação multi-tenant)
 */
export async function createInstance(userId: string): Promise<EvolutionInstance> {
  const res = await fetch(`${BASE_URL}/instance/create`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      instanceName: userId,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS',
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Evolution API [createInstance]: ${res.status} — ${err}`);
  }

  return res.json();
}

/**
 * Retorna o QR Code para conexão do WhatsApp.
 * Chamar logo após createInstance.
 */
export async function getQRCode(userId: string): Promise<EvolutionQRCode> {
  const res = await fetch(`${BASE_URL}/instance/connect/${userId}`, {
    method: 'GET',
    headers,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Evolution API [getQRCode]: ${res.status} — ${err}`);
  }

  return res.json();
}

/**
 * Verifica o estado atual da conexão.
 */
export async function getConnectionState(userId: string): Promise<EvolutionConnectionState> {
  const res = await fetch(`${BASE_URL}/instance/connectionState/${userId}`, {
    method: 'GET',
    headers,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Evolution API [getConnectionState]: ${res.status} — ${err}`);
  }

  return res.json();
}

/**
 * Desconecta e deleta a instância do usuário.
 */
export async function deleteInstance(userId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/instance/delete/${userId}`, {
    method: 'DELETE',
    headers,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Evolution API [deleteInstance]: ${res.status} — ${err}`);
  }
}

/**
 * Desconecta (logout) sem deletar a instância.
 */
export async function logoutInstance(userId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/instance/logout/${userId}`, {
    method: 'DELETE',
    headers,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Evolution API [logoutInstance]: ${res.status} — ${err}`);
  }
}

/**
 * Envia uma mensagem de texto para um número.
 */
export async function sendTextMessage(
  userId: string,
  numeroDestino: string,
  texto: string
): Promise<EvolutionSendMessage> {
  // Garante formato correto: 5511999887766@s.whatsapp.net
  const remoteJid = numeroDestino.includes('@')
    ? numeroDestino
    : `${numeroDestino}@s.whatsapp.net`;

  const res = await fetch(`${BASE_URL}/message/sendText/${userId}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      number: remoteJid,
      text: texto,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Evolution API [sendTextMessage]: ${res.status} — ${err}`);
  }

  return res.json();
}

/**
 * Configura o webhook na instância para receber eventos.
 * url = endpoint do seu N8N ou backend
 */
export async function setWebhook(userId: string, webhookUrl: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/webhook/set/${userId}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      url: webhookUrl,
      webhook_by_events: false,
      webhook_base64: false,
      events: [
        'MESSAGES_UPSERT',
        'CONNECTION_UPDATE',
        'QRCODE_UPDATED',
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Evolution API [setWebhook]: ${res.status} — ${err}`);
  }
}
