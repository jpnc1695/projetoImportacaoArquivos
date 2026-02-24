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
      // Adiciona o arquivo à lista
      const newFile = {
        id: Date.now(),
        name: selectedFile.name,
        size: (selectedFile.size / 1024).toFixed(2), // Tamanho em KB
        uploadDate: new Date().toLocaleDateString('pt-BR')
      }
      
      setPdfFiles([...pdfFiles, newFile])
      setSelectedFile(null)
      
      // Limpa o input file
      document.getElementById('pdf-upload').value = ''
      
      alert('Arquivo importado com sucesso!')
    }
  }

  const handleRemoveFile = (id) => {
    setPdfFiles(pdfFiles.filter(file => file.id !== id))
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Gerenciador de Arquivos PDF</h1>
      </header>

      <main className="app-main">
        <section className="upload-section">
          <h2>Importar Novo PDF</h2>
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
                <p>Arquivo selecionado: {selectedFile.name}</p>
                <p>Tamanho: {(selectedFile.size / 1024).toFixed(2)} KB</p>
                <button 
                  onClick={handleUpload}
                  className="upload-button"
                >
                  Confirmar Importação
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="list-section">
          <h2>Arquivos Exportados</h2>
          
          {pdfFiles.length === 0 ? (
            <p className="empty-message">Nenhum arquivo PDF importado ainda.</p>
          ) : (
            <div className="pdf-list">
              <table className="pdf-table">
                <thead>
                  <tr>
                    <th>Nome do Arquivo</th>
                    <th>Tamanho (KB)</th>
                    <th>Data de Importação</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {pdfFiles.map((file) => (
                    <tr key={file.id}>
                      <td>{file.name}</td>
                      <td>{file.size}</td>
                      <td>{file.uploadDate}</td>
                      <td>
                        <button 
                          onClick={() => handleRemoveFile(file.id)}
                          className="remove-button"
                        >
                          Remover
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <div className="pdf-stats">
                <p>Total de arquivos: {pdfFiles.length}</p>
                <p>Tamanho total: {
                  pdfFiles.reduce((total, file) => total + parseFloat(file.size), 0).toFixed(2)
                } KB</p>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default App