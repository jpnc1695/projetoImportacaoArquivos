import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import agentesData from '/src/Api/agentes.json'
import FileList from '../../Components/FileList/FileList'
import './Dashboard.css'

// Mover as funções para o escopo global do módulo
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};

const base64ToBlob = (base64) => {
  try {
    // Verificar se base64 é válido
    if (!base64 || typeof base64 !== 'string') {
      throw new Error('Base64 inválido');
    }
    
    // Extrair a parte base64 (remover o prefixo data:application/pdf;base64, se existir)
    const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
    
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: 'application/pdf' });
  } catch (error) {
    console.error('Erro ao converter base64 para blob:', error);
    throw error;
  }
};

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


  const [pdfFiles, setPdfFiles] = useState([])
  const [metadata, setMetadata] = useLocalStorage('pdfiles_metadata', []);
  const [selectedFiles, setSelectedFiles] = useState([])
  const [selectedAgent, setSelectedAgent] = useState('')
  const [processNumber, setProcessNumber] = useState('')
  const [agentes, setAgentes] = useState([])
  const [validationErrors, setValidationErrors] = useState({})
  const [isUploading, setIsUploading] = useState(false)

  const navigate = useNavigate()


  useEffect(() => {
    const loadSavedFiles = async () => {
      const saved = localStorage.getItem('pdfiles_base64');
      if (saved) {
        try {
          const filesData = JSON.parse(saved);
          // Converter Base64 de volta para objetos utilizáveis
          const files = filesData.map(data => ({
            ...data,
            // Não converter todos de uma vez para não travar a UI
            // A conversão será feita sob demanda no download
          }));
          setPdfFiles(files);
        } catch (error) {
          console.error('Erro ao carregar arquivos:', error);
        }
      }
    };
    
    loadSavedFiles();
  }, []);

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

  const handleUpload = async () => {
    if (selectedFiles.length > 0) {
      if (!validateFields()) return;
      
      setIsUploading(true);
      
      // Converter todos os arquivos para Base64
      const newFiles = await Promise.all(selectedFiles.map(async (file) => {
        const base64Data = await fileToBase64(file);
        
        return {
          id: Date.now() + Math.random(),
          name: file.name,
          size: (file.size / 1024).toFixed(2),
          uploadDate: new Date().toLocaleDateString('pt-BR'),
          base64Data: base64Data, // Armazena o Base64
          agente: selectedAgent,
          numeroProcesso: processNumber
        };
      }));
      
      const updatedFiles = [...pdfFiles, ...newFiles];
      setPdfFiles(updatedFiles);
      
      // Salvar no localStorage (apenas metadados + base64)
      localStorage.setItem('pdfiles_base64', JSON.stringify(updatedFiles));
      
      // Limpar seleção
      setSelectedFiles([]);
      setSelectedAgent('');
      setProcessNumber('');
      setValidationErrors({});
      setIsUploading(false);
      
      document.getElementById('pdf-upload').value = '';
      alert(`${newFiles.length} arquivo(s) importado(s) com sucesso!`);
    }
  };

// 2. Corrigir o handleDownload
const handleDownload = (file) => {
  try {
    if (file.base64Data) {
      // Converter Base64 para Blob
      const blob = base64ToBlob(file.base64Data);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.href = url;
      link.download = file.name;
      link.click();
      
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } else {
      alert('Arquivo corrompido ou inválido');
    }
  } catch (error) {
    console.error('Erro no download:', error);
    alert('Erro ao baixar arquivo');
  }
};
// Dashboard.js
const handleDownloadAll = async (filesToDownload) => {
  if (!filesToDownload || filesToDownload.length === 0) {
    alert('Não há arquivos para download');
    return;
  }

  if (filesToDownload.length > 5) {
    const confirm = window.confirm(
      `Baixar ${filesToDownload.length} arquivos?\n\n` +
      'Os arquivos serão baixados um por vez com intervalo de 500ms.'
    );
    if (!confirm) return;
  }

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < filesToDownload.length; i++) {
    const file = filesToDownload[i];
    
    try {
      const fileObject = file.fileData;
      
      if (!fileObject) {
        throw new Error('Dados do arquivo não encontrados');
      }
      
      const url = URL.createObjectURL(fileObject);
      const link = document.createElement('a');
      
      link.href = url;
      link.download = file.name;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
      
      successCount++;
      
      if (i < filesToDownload.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
    } catch (error) {
      console.error(`Erro ao baixar ${file.name}:`, error);
      errorCount++;
    }
  }

  alert(`${successCount} arquivo(s) baixado(s) com sucesso${errorCount > 0 ? `, ${errorCount} falha(s)` : ''}`);
};

const handleRemoveFile = (id) => {
  const fileToRemove = pdfFiles.find(file => file.id === id);
  if (fileToRemove && fileToRemove.url) {
    URL.revokeObjectURL(fileToRemove.url);
  }
  
  setPdfFiles(pdfFiles.filter(file => file.id !== id));
};

const handleRemoveAllFiles = (filesToRemove) => {
  const files = filesToRemove || pdfFiles;
  
  if (window.confirm(`Tem certeza que deseja remover todos os ${files.length} arquivo(s)?`)) {
    files.forEach(file => {
      if (file.url) {
        URL.revokeObjectURL(file.url);
      }
    });
    
    if (filesToRemove) {
      // Se recebeu arquivos filtrados, remove apenas eles
      const remainingFiles = pdfFiles.filter(
        file => !filesToRemove.some(f => f.id === file.id)
      );
      setPdfFiles(remainingFiles);
    } else {
      // Se não, remove todos
      setPdfFiles([]);
    }
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