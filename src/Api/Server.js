const express = require('express');
const cors = require('cors');
const fs = require('fs');
const app = express();
const dotenv = require('dotenv');
const config = require('../../config.js'); // ajuste o caminho relativo

const {body, validationResult} = require('express-validator');
const { createClient } = require('@supabase/supabase-js');


dotenv.config();


if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Servidor rodando localmente na porta ${PORT}`);
  });
}

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



app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Login e senha são obrigatórios' });
  }

  try {
    // Busca o usuário no Supabase pelo username
    const { data, error } = await supabase
      .from('users')
      .select('*')
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

// Endpoint para listar usuários
app.get('/api/agentes', async (req, res) => {
  try {
  const data = await readAgentes();
  const usersWithoutPasswords = data.agentes.map(({ password, ...agente }) => agente);
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
  body('origem').isIn(['importacao', 'agente', 'marketing']), // suas opções
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
/* app.post('/api/register', validateUser, async (req, res) => {

  const { username, password, name, email, origem, agenteId } = req.body;
  const agente = readAgentesPorId(agenteId);
  // Validações básicas

  if (!username || !password || !name || !email || !origem ) {
    return res.status(400).json({ 
      success: false, 
      message: 'Todos os campos são obrigatórios' 
    });
  }

  try {
    
    if (origem === 'agente' && !agente) {
      if(!agenteId){
        return res.status(400).json({ 
          success: false, 
          message: 'agenteId é obrigatório quando origem = agente' 
        });
       
      }
    }
    const {data: userExistente, error:checkerror} = await supabase.from('users')
      .select('*')
      .eq('username', username)
      .single();

    

  } catch (error) {
    
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
 */

app.post('/api/register', validateUser, async (req, res) => {
  const { username, password, name, email, origem, agenteId } = req.body;

  // 1. Validação básica
  if (!username || !password || !name || !email || !origem) {
    return res.status(400).json({ 
      success: false, 
      message: 'Todos os campos são obrigatórios' 
    });
  }

  try {
    // 2. Se a origem for 'agente', verificar se o agente existe no Supabase
    if (origem === 'agente') {
      if (!agenteId) {
        return res.status(400).json({ 
          success: false, 
          message: 'agenteId é obrigatório quando origem = agente' 
        });
      }

      const { data: agente, error: agenteError } = await supabase
        .from('agentes')
        .select('id')
        .eq('id', agenteId)
        .single();

      if (agenteError || !agente) {
        return res.status(400).json({ 
          success: false, 
          message: 'Agente não encontrado' 
        });
      }
    }

    // 3. Verificar se username ou email já existem
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('username, email')
      .or(`username.eq.${username},email.eq.${email}`);

    if (existingUser && existingUser.length > 0) {
      const conflict = existingUser[0];
      if (conflict.username === username) {
        return res.status(400).json({ 
          success: false, 
          message: 'Nome de usuário já existe' 
        });
      }
      if (conflict.email === email) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email já cadastrado' 
        });
      }
    }

    // 4. Criar objeto do novo usuário
    const newUser = {
      username,
      password, // ⚠️ Em produção: hash com bcrypt antes de salvar!
      name,
      email,
      role: 'user',
      origem,
      agenteId: origem === 'agente' ? agenteId : null,
      createdAt: new Date().toISOString()
    };

    // 5. Inserir no Supabase
    const { data: inserted, error: insertError } = await supabase
      .from('users')
      .insert([newUser])
      .select(); // retorna o registro inserido

    if (insertError) {
      console.error('Erro ao inserir usuário:', insertError);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno ao cadastrar usuário' 
      });
    }

    // 6. Remover a senha da resposta
    const { password: _, ...userWithoutPassword } = inserted[0];

    res.json({ 
      success: true, 
      message: 'Usuário cadastrado com sucesso',
      user: userWithoutPassword 
    });

  } catch (error) {
    console.error('Erro inesperado no cadastro:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno no servidor' 
    });
  }
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

module.exports = app;
