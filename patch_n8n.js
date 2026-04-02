const fs = require('fs');

const inFile = 'AUTOMAÇÃO OMNIZAP.AI (OFICIAL).json';
const outFile = 'OMNIZAP_ADAPTADO.json';

let data = JSON.parse(fs.readFileSync(inFile, 'utf8'));

// Referência para extrair `user_id` de forma segura (usando first() pois é um lookup global na pipeline)
const getUserIdExpr = "{{ $('Get a row1').first().json.user_id }}";

// 1. Encontrar o node de Webhook (o gatilho) e o nó subsequente.
const targetCodeNode = data.nodes.find(n => n.name === 'Code in JavaScript');

// 2. Adicionar nó "Buscar Config Agente"
const buscarAgenteNode = {
  "parameters": {
    "operation": "get",
    "tableId": "agents",
    "filters": {
      "conditions": [
        {
          "keyName": "user_id",
          "keyValue": getUserIdExpr
        },
        {
          "keyName": "ativo",
          "condition": "eq",
          "keyValue": true
        }
      ]
    }
  },
  "id": "e0bbedfa-ca01-4ebb-bfa1-163f25c830ef",
  "name": "Buscar Config Agente",
  "type": "n8n-nodes-base.supabase",
  "typeVersion": 1,
  "position": [
    targetCodeNode ? targetCodeNode.position[0] : 0, 
    (targetCodeNode ? targetCodeNode.position[1] : 0) - 200
  ],
  "alwaysOutputData": true,
  "credentials": {
    "supabaseApi": {
      "id": "08McCiYnqbejcODw", // Mesma credential
      "name": "OmniZap.AI"
    }
  }
};

if (!data.nodes.find(n => n.name === 'Buscar Config Agente')) {
  data.nodes.push(buscarAgenteNode);
} else {
  // Update the existing one just in case
  const existingNode = data.nodes.find(n => n.name === 'Buscar Config Agente');
  existingNode.parameters.filters.conditions[0].keyValue = getUserIdExpr;
}

// O N8N avalia expressões a partir dos nós anteriores, 
// Como "Buscar Config Agente" agora pode ser acessado em qualquer lugar assim:
// $('Buscar Config Agente').item.json.prompt pode falhar em complex streams.
// O CORRETO é: $('Buscar Config Agente').first().json.prompt
const getAgentPromptExpr = "={{ $('Buscar Config Agente').first().json.prompt || 'Você é um assistente de IA da OmniZap...' }}";

data.nodes.forEach(node => {
  // Ajusta operações Supabase com user_id (multi-tenant)
  if (['n8n-nodes-base.supabase', 'n8n-nodes-base.supabaseTool'].includes(node.type)) {
    const tableId = node.parameters.tableId;
    
    if (tableId === 'whatsapp_connections') return;
    
    // Inserts e updates de fieldsUi
    if (node.name === 'Criar Cliente1' && node.parameters.fieldsUi) {
      let fields = node.parameters.fieldsUi.fieldValues;
      let userField = fields.find(f => f.fieldId === 'user_id');
      if (userField) {
        userField.fieldValue = getUserIdExpr;
      } else {
        fields.push({ fieldId: 'user_id', fieldValue: getUserIdExpr });
      }
    }
    
    // Updates, GETs e DELETEs
    if (node.parameters.filters && node.parameters.filters.conditions) {
      let conditions = node.parameters.filters.conditions;
      let hasUserIdCondition = conditions.find(c => c.keyName === 'user_id');
      if (!hasUserIdCondition) {
        conditions.push({
          keyName: 'user_id',
          condition: 'eq',
          keyValue: getUserIdExpr
        });
      } else {
        hasUserIdCondition.keyValue = getUserIdExpr;
      }
    }
  }

  // Ajusta Prompts Dinâmicos nos Agentes
  if (node.type.includes('agent')) {
    if (node.parameters.options && node.parameters.options.systemMessage) {
      // Substitui pelo dinâmico corrigido (.first())
      node.parameters.options.systemMessage = getAgentPromptExpr;
    }
  }
});

// Rewire "Get a row1" para acionar "Buscar Config Agente"
if (data.connections['Get a row1']) {
  let hasConn = false;
  if(data.connections['Get a row1'].main && data.connections['Get a row1'].main[0]){
    hasConn = data.connections['Get a row1'].main[0].some(c => c.node === 'Buscar Config Agente');
    if(!hasConn) {
      data.connections['Get a row1'].main[0].push({
        "node": "Buscar Config Agente",
        "type": "main",
        "index": 0
      });
    }
  }
} else {
  data.connections['Get a row1'] = {
    main: [ [ { "node": "Buscar Config Agente", "type": "main", "index": 0 } ] ]
  };
}

// Salva as modificações
fs.writeFileSync(outFile, JSON.stringify(data, null, 2));
console.log('Script corrigido com .first() executado com sucesso.');
