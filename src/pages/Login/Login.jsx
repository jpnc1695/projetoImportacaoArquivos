import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Botao from '../../Components/Button/Button'
import usersData from '/src/Api/users.json' // Importa o JSON

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
    setUsers(usersData.users) // Carrega os usuários do JSON
  },[])  // Mock de usuários

  const handleLogin = (e) => {
    e.preventDefault()
    
    const user = users.find(
      u => u.username === username && u.password === password
    )

    if (user) {
      onLogin(username)
      navigate('/dashboard')
    } else {
      setLoginError('Usuário ou senha inválidos')
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-box">
          <div className="login-header">
            <h1>Gerenciador de Pdf</h1>
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
                <p key={user.id}>{user.username} / {user.password}</p>
              ))}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login