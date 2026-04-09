require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuração do Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Caminhos dos JSONs (ajuste conforme sua estrutura)
const USERS_JSON_PATH = path.join(__dirname, 'src', 'Api', 'users.json');
const AGENTES_JSON_PATH = path.join(__dirname,'src', 'Api', 'agentes.json');

async function migrateUsers() {
  console.log('📦 Lendo arquivo users.json...');
  const usersData = JSON.parse(fs.readFileSync(USERS_JSON_PATH, 'utf8'));
  let users = usersData.users || usersData; // suporta { users: [...] } ou array direto

  // Opcional: remover o campo 'id' para deixar o Supabase gerar auto-incremento
  // Mas se quiser manter os mesmos IDs, use upsert com 'onConflict'
  for (const user of users) {
    // Remove o campo 'id' se quiser novo ID sequencial
    // delete user.id;

    // Se você mantiver o ID, use upsert para evitar duplicação
    const { error } = await supabase
      .from('users')
      .upsert(user, { onConflict: 'id' }); // ou 'username' se não usar id
    if (error) {
      console.error(`❌ Erro ao inserir usuário ${user.username}:`, error.message);
    } else {
      console.log(`✅ Usuário ${user.username} migrado com sucesso.`);
    }
  }
}

async function migrateAgentes() {
  console.log('📦 Lendo arquivo agentes.json...');
  const agentesData = JSON.parse(fs.readFileSync(AGENTES_JSON_PATH, 'utf8'));
  let agentes = agentesData.agentes || agentesData;

  for (const agente of agentes) {
    // delete agente.id; // se quiser ID novo
    const { error } = await supabase
      .from('agentes')
      .upsert(agente, { onConflict: 'id' });
    if (error) {
      console.error(`❌ Erro ao inserir agente ${agente.username}:`, error.message);
    } else {
      console.log(`✅ Agente ${agente.username} migrado com sucesso.`);
    }
  }
}

async function main() {
  console.log('🚀 Iniciando migração para Supabase...');
  
  // Primeiro migrar agentes (por causa da chave estrangeira agenteId em users)
  await migrateAgentes();
  
  // Depois migrar usuários
  await migrateUsers();
  
  console.log('🎉 Migração concluída!');
}

main().catch(console.error);