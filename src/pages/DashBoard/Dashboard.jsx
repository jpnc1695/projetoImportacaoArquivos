import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import agentesData from '/src/Api/agentes.json' // Importa o JSON
import './Dashboard.css'

const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.log(error);
    }
  };

  return [storedValue, setValue];
};

function Dashboard({ username, onLogout }) {
  const [pdfFiles, setPdfFiles] = useLocalStorage('pdfiles', [])
  const [selectedFile, setSelectedFile] = useState(null)
  const [selectedAgent, setSelectedAgent] = useState('')
  const [agentes, setAgentes] = useState([]) // Estado para armazenar os agentes do JSON

  const navigate = useNavigate()

  // Carrega os agentes do JSON quando o componente monta
  useEffect(() => {
    // Verifica se agentesData existe e tem a propriedade agentes
    if (agentesData && agentesData.agentes) {
      setAgentes(agentesData.agentes)
      console.log('Agentes carregados:', agentesData.agentes) // Para debug
    } else {
      console.error('Formato do JSON inválido. Esperado: { agentes: [...] }')
    }
  }, []) // Array vazio = executa apenas uma vez

  const handleLogout = () => {
    onLogout()
    navigate('/')
  }

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
        url: fileUrl,
        agente: selectedAgent || 'Não atribuído'
      }
      
      setPdfFiles([...pdfFiles, newFile])
      setSelectedFile(null)
      setSelectedAgent('')
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
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="dashboard-box">
          <div className="dashboard-header">
            <div className="header-with-logout">
              <h1>Gerenciador de PDF</h1>
              <button onClick={handleLogout} className="logout-button">
                Sair
              </button>
            </div>
            <p>Bem-vindo, {username}!</p>
          </div>

          <div className="upload-section">
            <h2><strong>Importar PDF</strong></h2>
            <div className="upload-container">
              <input
                type="file"
                id="pdf-upload"
                accept=".pdf"
                onChange={handleFileChange}
                className="file-input"
              />
              
              {/* SELECT FORA DA CONDIÇÃO - SEMPRE VISÍVEL */}
              <div className="agente-selector">
                <label htmlFor="agente-select"><strong>Agente:</strong></label>
                <select
                  id="agente-select"
                  value={selectedAgent}
                  onChange={(e) => setSelectedAgent(e.target.value)}
                  className="agente-dropdown"
                >
                  <option value="">Selecione um agente</option>
                  {agentes.map(agente => (
                    <option key={agente.id} value={agente.name}>
                      {agente.name} ({agente.username})
                    </option>
                  ))}
                </select>
                
                <button 
                  onClick={() => navigate('/registrarAgente')}
                  className="cadastrar-agente-button"
                >
                  Cadastrar Agente
                </button>
              </div>
              
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
                        {file.agente && <span className="agente-tag"> • Agente: {file.agente}</span>}
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
                        <span className="remove-icon">🗑️</span>                    
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

export default Dashboard