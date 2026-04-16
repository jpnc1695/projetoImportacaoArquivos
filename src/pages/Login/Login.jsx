import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Botao from '../../Components/Button/Button'
import { supabase } from '../../supabaseClient';


import olhoAberto from '/src/assets/icons8-visível-50.png'
import olhoFechado from '/src/assets/icons8-ocultar-50.png'

import './Login.css'

function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [users, setUsers] = useState([]) // Usa os dados do JSON
  
  const navigate = useNavigate()

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('id');
      if (!error) setUsers(data);
    };
    fetchUsers();
  }, []);

  const handleLogin = async (e) => { 
    e.preventDefault();
    setLoginError('');
    
    try {
      // Faz a requisição para o backend
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      console.log(data);
    
      if (response.ok) {
        // Chama a função onLogin com os dados do usuário e o token
        console.log('Login bem-sucedido:', data.user);
        onLogin(data.user);
        navigate('/dashboard');
      } else {
        setLoginError(data.message || 'Usuário ou senha inválidos');
      }
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      setLoginError('Erro de conexão com o servidor');
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-box">
          <div className="login-header">
            <h1>Gerenciador de Arquivos da importação</h1>
            <p>Faça login para acessar</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="username">Usuário</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Digite seu usuário"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Senha</label>
              <div className="password-input-container">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Esconder senha" : "Mostrar senha"}
                >
                  <img 
                    src={showPassword ? olhoAberto : olhoFechado} 
                    alt={showPassword ? "Esconder senha" : "Mostrar senha"}
                    className="password-icon"
                  />
                </button>
              </div>
            </div>

            {loginError && (
              <div className="error-message">
                {loginError}
              </div>
            )}

            <Botao onClick={handleLogin} nome={"Entrar"} tipo={"submit"} />
              
            <div className="login-hint">
              <p><strong>Usuários de teste:</strong></p>
              {users.map(user => (
                <p key={user.id} style={user.origem === 'agente' ? { color: 'red' } : {}}>
                {user.username} / {user.password} / {user.origem}</p>
              ))}
            </div>
          </form> 
        </div>
      </div>
    </div>
  )
}

export default Login