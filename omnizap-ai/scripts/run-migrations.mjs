// ============================================================
// OmniZap.ai — Executa migrations diretamente no Supabase
// Uso: SUPABASE_SERVICE_KEY=sua_key node scripts/run-migrations.mjs
// ============================================================

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL     = 'https://qjndfbuyrulwmlkpgmzm.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('❌ Forneça a service_role key:\n   SUPABASE_SERVICE_KEY=sua_key node scripts/run-migrations.mjs');
  process.exit(1);
}

const migrations = [
  '001_saas_evolution_upgrade.sql',
  '002_n8n_chat_histories_views.sql',
];

async function runSQL(sql, label) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!res.ok) {
    // Tenta via Management API (query endpoint)
    const res2 = await fetch(`${SUPABASE_URL}/pg/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ query: sql }),
    });

    if (!res2.ok) {
      const err = await res2.text();
      throw new Error(`${label}: ${err}`);
    }
    return res2.json();
  }
  return res.json();
}

async function main() {
  console.log('🚀 Iniciando migrations OmniZap.ai...\n');

  for (const file of migrations) {
    const filePath = join(__dirname, '..', 'supabase', 'migrations', file);
    let sql;
    try {
      sql = readFileSync(filePath, 'utf8');
    } catch {
      console.warn(`⚠️  Arquivo não encontrado: ${file} — pulando`);
      continue;
    }

    // Divide em statements individuais para maior compatibilidade
    const statements = sql
      .split(/;\s*\n/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📄 Executando ${file} (${statements.length} statements)...`);

    for (const stmt of statements) {
      try {
        await runSQL(stmt + ';', file);
        process.stdout.write('.');
      } catch (e) {
        // Ignora erros de "já existe" (IF NOT EXISTS)
        if (e.message.includes('already exists') || e.message.includes('duplicate')) {
          process.stdout.write('~');
        } else {
          console.error(`\n⚠️  Aviso: ${e.message.slice(0, 200)}`);
        }
      }
    }
    console.log(` ✅\n`);
  }

  console.log('✅ Migrations concluídas!');
}

main().catch(e => {
  console.error('❌ Erro fatal:', e.message);
  process.exit(1);
});
