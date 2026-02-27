import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Botao from '../../Components/Button/Button.jsx'
import olhoAberto from '/src/assets/icons8-visível-50.png'
import olhoFechado from '/src/assets/icons8-ocultar-50.png'
import './CriarConta.css'

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    origem: 'importacao'
  })
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.username || !formData.password) {
      setError('Todos os campos são obrigatórios')
      return false
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem')
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('Email inválido')
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    console.log('Form data:', formData)
    if (!validateForm()) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('http://localhost:3001/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          username: formData.username,
          password: formData.password,
          origem: formData.origem
        })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Cadastro realizado com sucesso! Redirecionando...')
        setTimeout(() => {
          navigate('/')
        }, 2000)
      } else {
        setError(data.message)
      }
    } catch (error) {
      setError('Erro de conexão com o servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-box">
          <div className="register-header">
            <h1>Criar Conta</h1>
            <p>Preencha os dados para se cadastrar</p>
          </div>

          <form onSubmit={handleSubmit} className="register-form">
            <div className="form-group">
              <label htmlFor="name">Nome Completo</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Digite seu nome completo"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Digite seu email"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="username">Usuário</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Escolha um nome de usuário"
                required
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="origem">Origem</label>
              <select
                id="origem"
                name="origem"
                value={formData.origem}
                onChange={handleChange}
                required
                disabled={loading}
                className="origem-select"
              >
                <option value="importacao">Importação</option>
                <option value="marketing">Marketing</option>
                <option value="agente">Agente</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="password">Senha</label>
              <div className="password-input-container">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Crie uma senha (mínimo 6 caracteres)"
                  required
                  disabled={loading}
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

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmar Senha</label>
              <div className="password-input-container">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Digite a senha novamente"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  title={showConfirmPassword ? "Esconder senha" : "Mostrar senha"}
                >
                  <img 
                    src={showConfirmPassword ? olhoAberto : olhoFechado} 
                    alt={showConfirmPassword ? "Esconder senha" : "Mostrar senha"}
                    className="password-icon"
                  />
                </button>
              </div>
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {success && (
              <div className="success-message">
                {success}
              </div>
            )}


            <Botao nome={"Cadastrar"} tipo={"submit"} onClick={handleSubmit}/>

            <div className="login-link">
              <p>
                Já tem uma conta?{' '}
                <button 
                  type="button"
                  className="link-button"
                  onClick={() => navigate('/')}
                >
                  Faça login
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Register