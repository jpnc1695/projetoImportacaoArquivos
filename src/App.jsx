import { useState } from 'react'
import './App.css'

function App() {
  const [pdfFiles, setPdfFiles] = useState([])
  const [selectedFile, setSelectedFile] = useState(null)

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
      const newFile = {
        id: Date.now(),
        name: selectedFile.name,
        size: (selectedFile.size / 1024).toFixed(2),
        uploadDate: new Date().toLocaleDateString('pt-BR')
      }
      
      setPdfFiles([...pdfFiles, newFile])
      setSelectedFile(null)
      document.getElementById('pdf-upload').value = ''
      alert('Arquivo importado com sucesso!')
    }
  }

  const handleRemoveFile = (id) => {
    setPdfFiles(pdfFiles.filter(file => file.id !== id))
  }

  return (
    <div className="app">
      <div className="login-container">
        <div className="login-box">
          <div className="login-header">
            <h1>PDF Manager</h1>
            <p>Gerencie seus arquivos PDF</p>
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
                  <p><strong>Tamanho:</strong> {(selectedFile.size / 1024).toFixed(2)} KB</p>
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
            <h2>Arquivos Importados</h2>
            
            {pdfFiles.length === 0 ? (
              <p className="empty-message">Nenhum arquivo PDF importado</p>
            ) : (
              <div className="pdf-list">
                {pdfFiles.map((file) => (
                  <div key={file.id} className="pdf-item">
                    <div className="pdf-info">
                      <span className="pdf-name">{file.name}</span>
                      <span className="pdf-details">
                        {file.size} KB • {file.uploadDate}
                      </span>
                    </div>
                    <button 
                      onClick={() => handleRemoveFile(file.id)}
                      className="remove-button"
                    >
                      ×
                    </button>
                  </div>
                ))}
                
                <div className="pdf-stats">
                  <span>Total: {pdfFiles.length} arquivo(s)</span>
                  <span>Total: {
                    pdfFiles.reduce((total, file) => total + parseFloat(file.size), 0).toFixed(2)
                  } </span>
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