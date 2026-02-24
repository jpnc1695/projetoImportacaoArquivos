import { useState } from 'react'
import './App.css'

function App() {
  // Estados de autenticação
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false) // Novo estado
  const [loginError, setLoginError] = useState('')

  // Estados dos PDFs
  const [pdfFiles, setPdfFiles] = useState([])
  const [selectedFile, setSelectedFile] = useState(null)

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
      setIsLoggedIn(true)
      setLoginError('')
    } else {
      setLoginError('Usuário ou senha inválidos')
    }
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setUsername('')
    setPassword('')
    setPdfFiles([])
    setShowPassword(false) // Reset do estado ao sair
  }

  // Se não estiver logado, mostra tela de login
  if (!isLoggedIn) {
    return (
      <div className="app">
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

  // Área logada (seu código existente permanece igual)
  const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file)
    } else {
      alert('Por favor, selecione apenas arquivos PDF')
      event.target.value = null
    }
  }

  const handleUpload = () => {
    if (selectedFile) {
      const fileUrl = URL.createObjectURL(selectedFile)
      
      const newFile = {
        id: Date.now(),
        name: selectedFile.name,
        size: (selectedFile.size / 1024).toFixed(2),
        uploadDate: new Date().toLocaleDateString('pt-BR'),
        file: selectedFile,
        url: fileUrl
      }
      
      setPdfFiles([...pdfFiles, newFile])
      setSelectedFile(null)
      document.getElementById('pdf-upload').value = ''
      alert('Arquivo importado com sucesso!')
    }
  }

  const handleDownload = (file) => {
    const link = document.createElement('a')
    link.href = file.url
    link.download = file.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDownloadAll = () => {
    if (pdfFiles.length === 0) {
      alert('Não há arquivos para download')
      return
    }

    pdfFiles.forEach((file, index) => {
      setTimeout(() => {
        const link = document.createElement('a')
        link.href = file.url
        link.download = file.name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }, index * 500)
    })

    alert(`Iniciando download de ${pdfFiles.length} arquivo(s)`)
  }

  const handleRemoveFile = (id) => {
    const fileToRemove = pdfFiles.find(file => file.id === id)
    if (fileToRemove && fileToRemove.url) {
      URL.revokeObjectURL(fileToRemove.url)
    }
    
    setPdfFiles(pdfFiles.filter(file => file.id !== id))
  }

  const formatFileSize = (sizeInKB) => {
    if (sizeInKB < 1024) {
      return `${sizeInKB} KB`
    } else {
      return `${(sizeInKB / 1024).toFixed(2)} MB`
    }
  }

  return (
    <div className="app">
      <div className="login-container">
        <div className="login-box">
          <div className="login-header">
            <div className="header-with-logout">
              <h1>PDF Manager</h1>
              <button onClick={handleLogout} className="logout-button">
                Sair
              </button>
            </div>
            <p>Bem-vindo, {username}!</p>
          </div>

          <div className="upload-section">
            <h2>Importar PDF</h2>
            <div className="upload-container">
              <input
                type="file"
                id="pdf-upload"
                accept=".pdf"
                onChange={handleFileChange}
                className="file-input"
              />
              
              {selectedFile && (
                <div className="selected-file-info">
                  <p><strong>Arquivo:</strong> {selectedFile.name}</p>
                  <p><strong>Tamanho:</strong> {formatFileSize((selectedFile.size / 1024).toFixed(2))}</p>
                  <button 
                    onClick={handleUpload}
                    className="upload-button"
                  >
                    Confirmar Importação
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="list-section">
            <div className="list-header">
              <h2>Arquivos Importados</h2>
              {pdfFiles.length > 0 && (
                <button 
                  onClick={handleDownloadAll}
                  className="download-all-button"
                  title="Baixar todos os arquivos"
                >
                  <span className="download-icon">📥</span>
                  Baixar Todos
                </button>
              )}
            </div>
            
            {pdfFiles.length === 0 ? (
              <p className="empty-message">Nenhum arquivo PDF importado</p>
            ) : (
              <div className="pdf-list">
                {pdfFiles.map((file) => (
                  <div key={file.id} className="pdf-item">
                    <div className="pdf-info">
                      <span className="pdf-name">{file.name}</span>
                      <span className="pdf-details">
                        {formatFileSize(file.size)} • {file.uploadDate}
                      </span>
                    </div>
                    <div className="pdf-actions">
                      <button 
                        onClick={() => handleDownload(file)}
                        className="download-button"
                        title="Baixar arquivo"
                      >
                        <span className="download-icon">📥</span>
                      </button>
                      <button 
                        onClick={() => handleRemoveFile(file.id)}
                        className="remove-button"
                        title="Remover arquivo"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
                
                <div className="pdf-stats">
                  <span>Total: {pdfFiles.length} arquivo(s)</span>
                  <span>Total: {
                    formatFileSize(
                      pdfFiles.reduce((total, file) => total + parseFloat(file.size), 0).toFixed(2)
                    )
                  }</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App