import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import agentesData from '/src/Api/agentes.json'
import FileList from '../../Components/FileList/FileList'
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
  const [selectedFiles, setSelectedFiles] = useState([])
  const [selectedAgent, setSelectedAgent] = useState('')
  const [processNumber, setProcessNumber] = useState('')
  const [agentes, setAgentes] = useState([])
  const [validationErrors, setValidationErrors] = useState({})
  const [isUploading, setIsUploading] = useState(false)

  const navigate = useNavigate()

  // Carrega os agentes do JSON quando o componente monta
  useEffect(() => {
    if (agentesData && agentesData.agentes) {
      setAgentes(agentesData.agentes)
      console.log('Agentes carregados:', agentesData.agentes)
    } else {
      console.error('Formato do JSON inválido. Esperado: { agentes: [...] }')
    }
  }, [])

  const handleLogout = () => {
    onLogout()
    navigate('/')
  }

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files)
    
    const pdfFiles = files.filter(file => file.type === 'application/pdf')
    const nonPdfFiles = files.filter(file => file.type !== 'application/pdf')
    
    if (nonPdfFiles.length > 0) {
      alert(`${nonPdfFiles.length} arquivo(s) ignorado(s) por não serem PDF. Apenas arquivos PDF são permitidos.`)
    }
    
    if (pdfFiles.length > 0) {
      setSelectedFiles(pdfFiles)
      setValidationErrors({})
    } else {
      setSelectedFiles([])
      event.target.value = null
    }
  }

  const validateFields = () => {
    const errors = {}
    
    if (!selectedAgent) {
      errors.agent = 'Selecione um agente'
    }
    
    if (!processNumber || processNumber.trim() === '') {
      errors.process = 'O número do processo é obrigatório'
    } else if (processNumber.trim().length < 5) {
      errors.process = 'O número do processo deve ter pelo menos 5 caracteres'
    }
    
    if (selectedFiles.length === 0) {
      errors.files = 'Selecione pelo menos um arquivo PDF'
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleUpload = () => {
    if (selectedFiles.length > 0) {
      if (!validateFields()) {
        return
      }
      
      setIsUploading(true)
      
      const newFiles = selectedFiles.map(file => {
        const fileUrl = URL.createObjectURL(file)
        return {
          id: Date.now() + Math.random(),
          name: file.name,
          size: (file.size / 1024).toFixed(2),
          uploadDate: new Date().toLocaleDateString('pt-BR'),
          file: file,
          url: fileUrl,
          agente: selectedAgent,
          numeroProcesso: processNumber
        }
      })
      
      setPdfFiles([...pdfFiles, ...newFiles])
      
      setSelectedFiles([])
      setSelectedAgent('')
      setProcessNumber('')
      setValidationErrors({})
      setIsUploading(false)
      
      document.getElementById('pdf-upload').value = ''
      
      alert(`${newFiles.length} arquivo(s) importado(s) com sucesso!`)
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

  const handleRemoveAllFiles = () => {
    if (window.confirm('Tem certeza que deseja remover todos os arquivos?')) {
      pdfFiles.forEach(file => {
        if (file.url) {
          URL.revokeObjectURL(file.url)
        }
      })
      setPdfFiles([])
    }
  }

  const formatFileSize = (sizeInKB) => {
    if (sizeInKB < 1024) {
      return `${sizeInKB} KB`
    } else {
      return `${(sizeInKB / 1024).toFixed(2)} MB`
    }
  }

  const getSelectedAgentName = () => {
    const agent = agentes.find(a => a.name === selectedAgent)
    return agent ? `${agent.name} (${agent.username})` : selectedAgent
  }

  const getTotalSelectedSize = () => {
    const totalKB = selectedFiles.reduce((total, file) => total + (file.size / 1024), 0)
    return formatFileSize(totalKB.toFixed(2))
  }

  const clearSelectedFiles = () => {
    setSelectedFiles([])
    document.getElementById('pdf-upload').value = ''
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
            <h2><strong>Importar PDFs</strong></h2>
            <div className="upload-container">
              <input
                type="file"
                id="pdf-upload"
                accept=".pdf"
                onChange={handleFileChange}
                className="file-input"
                multiple
              />
              
              <div className="agente-selector">
                <label htmlFor="agente-select"><strong>Agente:</strong></label>
                <select
                  id="agente-select"
                  value={selectedAgent}
                  onChange={(e) => {
                    setSelectedAgent(e.target.value)
                    if (validationErrors.agent) {
                      setValidationErrors({...validationErrors, agent: null})
                    }
                  }}
                  className={`agente-dropdown ${validationErrors.agent ? 'error' : ''}`}
                >
                  <option value="">Selecione um agente</option>
                  {agentes.map(agente => (
                    <option key={agente.id} value={agente.name}>
                      {agente.name} ({agente.username})
                    </option>
                  ))}
                </select>
                
                {validationErrors.agent && (
                  <span className="error-message">{validationErrors.agent}</span>
                )}

                <button 
                  onClick={() => navigate('/registrarAgente')}
                  className="cadastrar-agente-button"
                >
                  Cadastrar Agente
                </button>
              </div>

              <div className="processo-selector">
                <label htmlFor="processo-number"><strong>Nº do processo:</strong></label>
                <input
                  type="text"
                  id="processo-number"
                  value={processNumber}
                  onChange={(e) => {
                    setProcessNumber(e.target.value)
                    if (validationErrors.process) {
                      setValidationErrors({...validationErrors, process: null})
                    }
                  }}
                  placeholder="Digite o número do processo"
                  className={`processo-input ${validationErrors.process ? 'error' : ''}`}
                />
                
                {validationErrors.process && (
                  <span className="error-message">{validationErrors.process}</span>
                )}
              </div>

              {selectedFiles.length > 0 && (
                <div className="selected-files-info">
                  <div className="selected-files-header">
                    <h3>Arquivos Selecionados ({selectedFiles.length})</h3>
                    <button 
                      onClick={clearSelectedFiles}
                      className="clear-files-button"
                      title="Limpar seleção"
                    >
                      <span className="clear-icon">✕</span> Limpar
                    </button>
                  </div>
                  
                  <div className="selected-files-list">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="selected-file-item">
                        <span className="file-name">{file.name}</span>
                        <span className="file-size">{formatFileSize((file.size / 1024).toFixed(2))}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="selected-files-summary">
                    <p><strong>Total de arquivos:</strong> {selectedFiles.length}</p>
                    <p><strong>Tamanho total:</strong> {getTotalSelectedSize()}</p>
                    
                    {selectedAgent && (
                      <p><strong>Agente:</strong> {getSelectedAgentName()}</p>
                    )}
                    
                    {processNumber && (
                      <p><strong>Nº do processo:</strong> {processNumber}</p>
                    )}
                  </div>
                  
                  {validationErrors.files && (
                    <span className="error-message">{validationErrors.files}</span>
                  )}
                  
                  <button 
                    onClick={handleUpload}
                    className="upload-button"
                    disabled={!selectedAgent || !processNumber || selectedFiles.length === 0 || isUploading}
                  >
                    {isUploading ? 'Importando...' : `Importar ${selectedFiles.length} arquivo(s)`}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Componente FileList */}
          <FileList 
            pdfFiles={pdfFiles}
            onDownload={handleDownload}
            onRemove={handleRemoveFile}
            onDownloadAll={handleDownloadAll}
            onRemoveAll={handleRemoveAllFiles}
            formatFileSize={formatFileSize}
          />

        </div>
      </div>
    </div>
  )
}

export default Dashboard