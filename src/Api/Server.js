const express = require('express');
const {body, validationResult} = require('express-validator');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());

const USERS_FILE = path.join(__dirname, 'users.json');
const AGENTE_FILE = path.join(__dirname, 'agentes.json');

// Função para ler usuários do arquivo
const readUsers = () => {
  try {
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { users: [] };
  }
};



const readAgentes = () => {
  try {
    const data = fs.readFileSync(AGENTE_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { agentes: [] };
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
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const data = readUsers();
  
  const user = data.users.find(u => u.username === username && u.password === password);
  
  if (user) {
    const { password, ...userWithoutPassword } = user;
    res.json({ success: true, user: userWithoutPassword });
  } else {
    res.status(401).json({ success: false, message: 'Usuário ou senha inválidos' });
  }
});

// Endpoint para listar Agentes
app.get('/api/agentes', (req, res) => {
  const data = readAgentes();
  res.json(data.agentes);
});



// Endpoint para listar usuários
app.get('/api/users', (req, res) => {
  const data = readUsers();
  const usersWithoutPasswords = data.users.map(({ password, ...user }) => user);
  res.json(usersWithoutPasswords);
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