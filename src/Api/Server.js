const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());

const USERS_FILE = path.join(__dirname, 'users.json');

// Função para ler usuários do arquivo
const readUsers = () => {
  try {
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { users: [] };
  }
};

// Função para escrever usuários no arquivo
const writeUsers = (data) => {
  fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2), 'utf8');
};

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

// Endpoint para listar usuários
app.get('/api/users', (req, res) => {
  const data = readUsers();
  const usersWithoutPasswords = data.users.map(({ password, ...user }) => user);
  res.json(usersWithoutPasswords);
});

// Endpoint para cadastrar novo usuário
app.post('/api/register', (req, res) => {
  const { username, password, name, email } = req.body;
  
  // Validações básicas
  if (!username || !password || !name || !email) {
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
    createdAt: new Date().toISOString()
  };

  data.users.push(newUser);
  writeUsers(data);

  const { password: _, ...userWithoutPassword } = newUser;
  res.json({ 
    success: true, 
    message: 'Usuário cadastrado com sucesso',
    user: userWithoutPassword 
  });
});

app.listen(3001, () => {
  console.log('Servidor rodando na porta 3001');
});