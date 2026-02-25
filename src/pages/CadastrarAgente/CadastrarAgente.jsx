import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Botao from '../../Components/Button/Button.jsx'
import './CadastrarAgente.css'

function RegisterAgente() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: ''
  })
  
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
    if (!formData.name || !formData.email || !formData.username) {
      setError('Todos os campos são obrigatórios')
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
    
    if (!validateForm()) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('http://localhost:3001/api/registerAgente', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          username: formData.username,
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
            <h1>Cadastrar Agente</h1>
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
                placeholder="Nome do agente"
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
                placeholder="Email do agente"
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


            <Botao nome={"Cadastrar Agente"} tipo={"submit"} onClick={handleSubmit}/>

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

export default RegisterAgente