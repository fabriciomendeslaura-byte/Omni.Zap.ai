-- ============================================================
-- OmniZap.ai — Migração SaaS + Evolution API
-- Apenas adições incrementais, sem destruir nada existente
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. Tabela agents — campos para configuração dinâmica + N8N
-- ────────────────────────────────────────────────────────────
ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS regras       TEXT[]   DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS contexto     JSONB    DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS variaveis    JSONB    DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS n8n_webhook  TEXT,
  ADD COLUMN IF NOT EXISTS max_tokens   INTEGER  DEFAULT 500;

COMMENT ON COLUMN agents.regras      IS 'Lista de regras do agente (ex: Nunca mencionar concorrentes)';
COMMENT ON COLUMN agents.contexto    IS 'Contexto do negócio em JSON livre';
COMMENT ON COLUMN agents.variaveis   IS 'Variáveis dinâmicas substituíveis no prompt';
COMMENT ON COLUMN agents.n8n_webhook IS 'URL do webhook N8N que este agente aciona';
COMMENT ON COLUMN agents.max_tokens  IS 'Limite de tokens por resposta';

-- ────────────────────────────────────────────────────────────
-- 2. whatsapp_connections — vínculo com agente ativo
-- ────────────────────────────────────────────────────────────
ALTER TABLE whatsapp_connections
  ADD COLUMN IF NOT EXISTS agent_id        UUID REFERENCES agents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reconnect_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS webhook_url     TEXT;

COMMENT ON COLUMN whatsapp_connections.agent_id        IS 'Agente ativo vinculado a este número';
COMMENT ON COLUMN whatsapp_connections.reconnect_count IS 'Contador de reconexões automáticas';
COMMENT ON COLUMN whatsapp_connections.webhook_url     IS 'URL de webhook configurada na Evolution API';

-- ────────────────────────────────────────────────────────────
-- 3. Índices para roteamento rápido no N8N
-- ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_whatsapp_conn_numero
  ON whatsapp_connections(numero);

CREATE INDEX IF NOT EXISTS idx_whatsapp_conn_session
  ON whatsapp_connections(session_id);

CREATE INDEX IF NOT EXISTS idx_agents_user_ativo
  ON agents(user_id, ativo);

-- ────────────────────────────────────────────────────────────
-- 4. Tabela whatsapp_messages — log de todas as mensagens
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  agent_id     UUID        REFERENCES agents(id) ON DELETE SET NULL,
  session_id   TEXT        NOT NULL,
  numero_de    TEXT        NOT NULL,
  numero_para  TEXT        NOT NULL,
  mensagem     TEXT        NOT NULL,
  direcao      TEXT        NOT NULL CHECK (direcao IN ('entrada', 'saida')) DEFAULT 'entrada',
  status       TEXT        NOT NULL DEFAULT 'recebida',
  n8n_exec_id  TEXT,
  metadata     JSONB       DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_msg_user_date
  ON whatsapp_messages(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_whatsapp_msg_session
  ON whatsapp_messages(session_id, created_at DESC);

-- ────────────────────────────────────────────────────────────
-- 5. RLS — isolamento multi-tenant
-- ────────────────────────────────────────────────────────────
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_own_whatsapp_messages" ON whatsapp_messages;
CREATE POLICY "user_own_whatsapp_messages" ON whatsapp_messages
  FOR ALL USING (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- 6. View auxiliar para o N8N buscar roteamento por número
--    Uso: SELECT * FROM v_whatsapp_routing WHERE numero = '55119...'
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_whatsapp_routing AS
SELECT
  wc.session_id,
  wc.user_id,
  wc.numero,
  wc.status          AS conn_status,
  wc.agent_id,
  a.nome             AS agent_nome,
  a.tipo             AS agent_tipo,
  a.prompt           AS agent_prompt,
  a.tom              AS agent_tom,
  a.regras           AS agent_regras,
  a.contexto         AS agent_contexto,
  a.variaveis        AS agent_variaveis,
  a.n8n_webhook      AS agent_n8n_webhook,
  a.max_tokens       AS agent_max_tokens
FROM whatsapp_connections wc
LEFT JOIN agents a ON a.id = wc.agent_id
WHERE wc.status = 'connected';

COMMENT ON VIEW v_whatsapp_routing IS
  'View usada pelo N8N para rotear mensagens ao agente correto via número conectado';
