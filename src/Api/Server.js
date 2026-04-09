const express = require('express');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();
const dotenv = require('dotenv');
const config = require('../../config.js'); // ajuste o caminho relativo

const {body, validationResult} = require('express-validator');
const { createClient } = require('@supabase/supabase-js');


dotenv.config({path: config});

app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);


// Função para ler usuários do arquivo
async function readUsers() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*'); 
      return {users: data || []} 

  } catch (error) {
    return { users: [] };
  }
};

async function readAgentes ()  {
  try {
    const { data, error } = await supabase
      .from('agentes')
      .select('*'); 
      return {agentes: data || []}

  } catch (error) {
    return { agente: [] };
  }
};
// Função para escrever usuários no arquivo
const writeUsers = (data) => {
  fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2), 'utf8');
};

const writeAgentes = (data) => {
  fs.writeFileSync(AGENTE_FILE, JSON.stringify(data, null, 2), 'utf8');
};

function readAgentesPorId(id) {
  try {
    const data = fs.readFileSync(AGENTE_FILE, 'utf8');
    const parsed = JSON.parse(data);

    // Normaliza para trabalhar sempre com array
    let agentes = [];
    if (Array.isArray(parsed)) {
      agentes = parsed;
    } else if (parsed && Array.isArray(parsed.agentes)) {
      agentes = parsed.agentes;
    }

    // Busca o agente pelo ID (comparando como string para evitar erros de tipo)
    const agente = agentes.find(agente => String(agente.id) === String(id));
    return agente || null; // se não achar, retorna null
  } catch (error) {
    console.error('Erro ao ler o arquivo de agentes:', error.message);
    return null; // em caso de erro, retorna null
  }
}


// Endpoint de login
/* app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  // Validação básica
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Login e senha são obrigatórios' });
  }

  try {
    // Chama a API externa com os parâmetros "login" e "password"
    console.log('Enviando requisição para API externa com:', { login: username, password: password });
    var Urllogin = 'https://ai-first.firstclasshome.com.br/api/login'

    const response = await axios.post(Urllogin, {
      login: username,
      password: password
    });

    // Supondo que a API externa retorne algo como:
    // { success: true, user: { id, name, email, ... } } ou apenas um token
    // Ajuste conforme a resposta real da API.
    if (response.data && response.data.status === 'OK') {
      // Se a resposta já trouxer os dados do usuário (sem senha), podemos usá-los diretamente
      const userData = response.data.device_code; // adapte conforme necessário
      console.log(userData);
      // Se a API não retornar o usuário, você pode buscar ou montar um objeto básico
      res.json(response.data);
    } else {
      // Se a API retornou sucesso false ou estrutura diferente
      res.status(401).json({ 
        success: false, 
        message: response.data.message || 'Credenciais inválidas' 
      });
    }
  } catch (error) {
    // Tratamento de erro (credenciais inválidas, API offline, etc.)
    console.error('Erro ao autenticar na API externa:', error.message);
    if (error.response && error.response.status === 401) {
      res.status(401).json({ success: false, message: 'Usuário ou senha inválidos' });
    } else {
      res.status(500).json({ success: false, message: 'Erro interno ao validar credenciais' });
    }
  }
}); */

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Login e senha são obrigatórios' });
  }

  try {
    // Busca o usuário no Supabase pelo username
    const { data, error } = await supabase
      .from('users')
      .select('id, username, name, email, role, origem, password,"agenteId"')
      .eq('username', username)
      .single();
      console.log(data)

    if (error || !data) {
      return res.status(401).json({ success: false, message: 'Usuário ou senha inválidos' });
    }

    // Compara a senha (em texto puro – recomendo usar hash futuramente)
    if (data.password !== password) {
      return res.status(401).json({ success: false, message: 'Usuário ou senha inválidos' });
    }

    // Retorna sucesso e os dados do usuário (sem a senha)
    const { password: _, ...userWithoutPassword } = data;
    return res.json({
      success: true,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Erro no login:', error.message);
    return res.status(500).json({ success: false, message: 'Erro interno no servidor' });
  }
});

/* // Endpoint de polling – verifica se o usuário já autorizou o dispositivo
app.post('/api/device/token', async (req, res) => {
  const { device_code } = req.body;

  if (!device_code) {
    return res.status(400).json({ error: 'device_code é obrigatório' });
  }

    var Logintoken  = 'https://ai-first.firstclasshome.com.br/api/login'

  try {
    // Chama o endpoint da API externa que verifica o status do device
    // (Ajuste a URL conforme a documentação da API – exemplo genérico)
    const response = await axios.post( Logintoken, {
      device_code: device_code
    });

    // A resposta da API externa pode ter campos como:
    // { auth_status: "authorized" | "pending" | "expired", user_id, username, access_token, ... }
    // Retornamos exatamente o que ela devolve
    console.log(`Polling com device_code: ${device_code}, resposta:`, response.data);
    return res.json(response.data);

  } catch (error) {
    console.error('Erro no polling:', error.message);
    // Se a API retornar 400/404, provavelmente o device_code é inválido ou expirou
    if (error.response?.status === 400 || error.response?.status === 404) {
      return res.status(400).json({ auth_status: 'expired', error: 'Device code inválido ou expirado' });
    }
    return res.status(500).json({ error: 'Erro ao verificar autorização' });
  }
}); */


// Endpoint para listar usuários
app.get('/api/users', async (req, res) => {
  try {
  const data = await readUsers();
  const usersWithoutPasswords = data.users.map(({ password, ...user }) => user);
  res.json(usersWithoutPasswords);
}
  catch (error) {
      console.error('Erro ao ler usuários:', error.message);
      res.status(500).json({ success: false, message: 'Erro interno ao ler usuários' });

  }
});


const validateUser = [
  body('username').notEmpty(),
  body('password').notEmpty(),
  body('name').notEmpty(),
  body('email').isEmail(),
  body('origem').isIn(['importacao', 'agente', 'manual']), // suas opções
  body('agenteId')
    .if(body('origem').equals('agente'))
    .notEmpty().withMessage('agenteId é obrigatório quando origem = agente')
    .isInt().withMessage('agenteId deve ser um número inteiro'),
  // se não for agente, agenteId é opcional e pode ser null
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// Endpoint para cadastrar novo usuário
app.post('/api/register', validateUser, async (req, res) => {

  console.log('Requisição de registro recebida:', validateUser);
  const { username, password, name, email, origem, agenteId } = req.body;
  const agente = readAgentesPorId(agenteId);

  console.log('Agentes disponíveis:', agente);
  if (origem === 'agente') {
    if (!agente) {
      return res.status(400).json({ error: 'Agente não encontrado' });
    }
  }
  
  // Validações básicas
  if (!username || !password || !name || !email || !origem ) {
    return res.status(400).json({ 
      success: false, 
      message: 'Todos os campos são obrigatórios' 
    });
  }

  const data = readUsers();
  
  // Verificar se usuário já existe
  const userExists = data.users.some(u => u.username === username);
  if (userExists) {
    return res.status(400).json({ 
      success: false, 
      message: 'Nome de usuário já existe' 
    });
  }

  // Verificar se email já existe
  const emailExists = data.users.some(u => u.email === email);
  if (emailExists) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email já cadastrado' 
    });
  }

  // Criar novo usuário
  const newUser = {
    id: data.users.length + 1,
    username,
    password, // Em produção, hash a senha!
    name,
    email,
    role: 'user',
    origem,
    agenteId: origem === 'agente' ? agenteId : null,
    createdAt: new Date().toISOString()
  };


  console.log(newUser)
  data.users.push(newUser);
  writeUsers(data);

  const { password: _, ...userWithoutPassword } = newUser;
  res.json({ 
    success: true, 
    message: 'Usuário cadastrado com sucesso',
    user: userWithoutPassword 
  });
});


app.delete('/api/agentes/:id', (req, res) => {
  const agenteId = parseInt(req.params.id);
  if (isNaN(agenteId)) {
    return res.status(400).json({ success: false, message: 'ID inválido' });
  }

  const data = readAgentes();
  const agenteExists = data.agentes.some(agente => agente.id === agenteId);

  if (!agenteExists) {
    return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
  }

  data.agentes = data.agentes.filter(agente => agente.id !== agenteId);
  writeUsers(data);

  res.json({ success: true, message: 'Usuário excluído com sucesso' });
});

app.delete('/api/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  if (isNaN(userId)) {
    return res.status(400).json({ success: false, message: 'ID inválido' });
  }

  const data = readUsers();
  const userExists = data.users.some(user => user.id === userId);

  if (!userExists) {
    return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
  }

  data.users = data.users.filter(user => user.id !== userId);
  writeUsers(data);

  res.json({ success: true, message: 'Usuário excluído com sucesso' });
});

// Endpoint para cadastrar novo Agente
app.post('/api/registerAgente', (req, res) => {
  const { username, name, email } = req.body;
  
  // Validações básicas
  if (!username || !name || !email) {
    return res.status(400).json({ 
      success: false, 
      message: 'Todos os campos são obrigatórios' 
    });
  }

  const data = readAgentes();
  
  // Verificar se agente já existe
  const agenteExists = data.agentes.some(u => u.username === username);
  if (agenteExists) {
    return res.status(400).json({ 
      success: false, 
      message: 'Nome de agente já existe' 
    });
  }

  // Verificar se email já existe
  const emailExists = data.agentes.some(u => u.email === email);
  if (emailExists) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email já cadastrado' 
    });
  }

  // Criar novo Agente
  const newAgente = {
    id: data.agentes.length + 1,
    username,
    name,
    email,
    role: 'agente',
    createdAt: new Date().toISOString()
  };

  data.agentes.push(newAgente);
  writeAgentes(data);

  res.json({ 
    success: true, 
    message: 'Agente cadastrado com sucesso',
    agente: newAgente
  });
});

app.listen(3001, () => {
  console.log('Servidor rodando na porta 3001');
});