-- ============================================================
-- OmniZap.ai — Views para n8n_chat_histories
-- Conecta o histórico do N8N com o painel de conversas
-- ============================================================
--
-- IMPORTANTE — Formato do session_id no N8N:
-- Configure seu workflow N8N para usar session_id = '{user_id}_{telefone}'
-- Exemplo: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890_5511999887766'
--
-- No N8N, no nó de Memória Supabase, defina Session ID como:
-- {{ $('Webhook').item.json.instance }}_{{ $('Webhook').item.json.data.key.remoteJid.replace('@s.whatsapp.net','') }}
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. View: Lista de conversas agrupadas por session_id
--    Usada na sidebar esquerda da página de conversas
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW n8n_conversations_list AS
WITH last_messages AS (
  -- Pega apenas a última mensagem de cada sessão
  SELECT DISTINCT ON (session_id)
    session_id,
    message,
    created_at,
    id
  FROM n8n_chat_histories
  ORDER BY session_id, id DESC
)
SELECT
  lm.session_id,

  -- user_id: extraído do prefixo do session_id (formato: {user_id}_{telefone})
  CASE
    WHEN lm.session_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_'
    THEN SPLIT_PART(lm.session_id, '_', 1)::uuid
    ELSE wc.user_id
  END AS user_id,

  -- telefone do contato: parte após o primeiro '_'
  CASE
    WHEN lm.session_id ~ '_'
    THEN REGEXP_REPLACE(SPLIT_PART(lm.session_id, '_', 2), '@s\.whatsapp\.net', '')
    ELSE REGEXP_REPLACE(lm.session_id, '@s\.whatsapp\.net', '')
  END AS lead_telefone,

  -- Nome do lead (da tabela leads, se existir; senão usa o telefone)
  COALESCE(l.nome,
    CASE
      WHEN lm.session_id ~ '_'
      THEN REGEXP_REPLACE(SPLIT_PART(lm.session_id, '_', 2), '@s\.whatsapp\.net', '')
      ELSE REGEXP_REPLACE(lm.session_id, '@s\.whatsapp\.net', '')
    END
  ) AS lead_nome,

  -- ID do lead (se existir na tabela leads)
  COALESCE(l.id::text, lm.session_id) AS lead_id,

  -- Status do lead
  COALESCE(l.status, 'novo') AS lead_status,

  -- Conteúdo da última mensagem (compatível com formato N8N padrão)
  COALESCE(
    lm.message->'data'->>'content',
    lm.message->>'content',
    lm.message->'kwargs'->>'content',
    '...'
  ) AS ultima_mensagem,

  -- Origem da última mensagem
  CASE
    WHEN COALESCE(lm.message->>'type', lm.message->'data'->>'type') = 'human'
    THEN 'cliente'
    ELSE 'ia'
  END AS ultima_origem,

  -- Timestamp da última mensagem
  lm.created_at AS ultima_msg_at,

  -- Total de mensagens na conversa
  COUNT(h.id) OVER (PARTITION BY lm.session_id) AS total_mensagens

FROM last_messages lm
-- Join para confirmar user_id via whatsapp_connections (fallback)
LEFT JOIN whatsapp_connections wc ON (
  lm.session_id LIKE wc.session_id || '_%'
)
-- Join com leads pelo telefone
LEFT JOIN leads l ON (
  l.telefone = REGEXP_REPLACE(SPLIT_PART(lm.session_id, '_', 2), '@s\.whatsapp\.net', '')
  OR l.telefone = REGEXP_REPLACE(lm.session_id, '@s\.whatsapp\.net', '')
)
-- Join para contagem
LEFT JOIN n8n_chat_histories h ON h.session_id = lm.session_id;

COMMENT ON VIEW n8n_conversations_list IS
  'Lista de conversas agrupadas por session_id para o painel do usuário SaaS';


-- ────────────────────────────────────────────────────────────
-- 2. View: Mensagens individuais de uma conversa
--    Usada ao abrir uma conversa específica
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW n8n_messages AS
SELECT
  h.id::text                                              AS id,
  h.session_id,
  h.session_id                                            AS lead_id,

  -- Conteúdo da mensagem
  COALESCE(
    h.message->'data'->>'content',
    h.message->>'content',
    h.message->'kwargs'->>'content',
    ''
  ) AS mensagem,

  -- Origem: 'cliente' (human) ou 'ia' (ai)
  CASE
    WHEN COALESCE(h.message->>'type', h.message->'data'->>'type') = 'human'
    THEN 'cliente'
    ELSE 'ia'
  END AS origem,

  h.created_at

FROM n8n_chat_histories h
ORDER BY h.id ASC;

COMMENT ON VIEW n8n_messages IS
  'Mensagens individuais do N8N formatadas para o chat do painel';


-- ────────────────────────────────────────────────────────────
-- 3. RLS — as views herdam as permissões das tabelas base
--    Garante que o SELECT na view seja seguro
-- ────────────────────────────────────────────────────────────
-- A tabela n8n_chat_histories deve ter RLS ativo.
-- Se ainda não tiver, rode:

ALTER TABLE n8n_chat_histories ENABLE ROW LEVEL SECURITY;

-- Política: usuário vê apenas suas sessões (session_id começa com seu user_id)
DROP POLICY IF EXISTS "user_own_n8n_histories" ON n8n_chat_histories;
CREATE POLICY "user_own_n8n_histories" ON n8n_chat_histories
  FOR ALL USING (
    -- session_id no formato '{user_id}_{phone}'
    session_id LIKE (auth.uid()::text || '_%')
    -- OU session_id é exatamente o user_id (fallback)
    OR session_id = auth.uid()::text
  );
