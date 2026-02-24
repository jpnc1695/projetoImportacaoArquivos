import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Login.css'

function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState('')
  
  const navigate = useNavigate()

  // Mock de usuários
  const MOCK_USERS = [
    { username: 'admin', password: '123456' },
    { username: 'usuario', password: 'senha123' },
    { username: 'teste', password: 'teste' }
  ]

  const handleLogin = (e) => {
    e.preventDefault()
    
    const user = MOCK_USERS.find(
      u => u.username === username && u.password === password
    )

    if (user) {
      onLogin(username) // Passa o usuário para o componente pai
      navigate('/dashboard') // Redireciona para a página de PDFs
    } else {
      setLoginError('Usuário ou senha inválidos')
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-box">
          <div className="login-header">
            <h1>PDF Manager</h1>
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
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            {loginError && (
              <div className="error-message">
                {loginError}
              </div>
            )}

            <button type="submit" className="login-button">
              Entrar
            </button>

            <div className="login-hint">
              <p><strong>Usuários de teste:</strong></p>
              <p>admin / 123456</p>
              <p>usuario / senha123</p>
              <p>teste / teste</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login