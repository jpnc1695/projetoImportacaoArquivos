// FileList.js
import React from 'react';
import './Dashboard.css'; // Reutiliza o mesmo CSS

const FileList = ({ pdfFiles, onDownload, onRemove, onDownloadAll, onRemoveAll, formatFileSize }) => {
  
  const handleDownloadFile = (file) => {
    onDownload(file);
  };

  const handleRemoveFile = (id) => {
    if (window.confirm('Tem certeza que deseja remover este arquivo?')) {
      onRemove(id);
    }
  };

  const handleDownloadAll = () => {
    onDownloadAll();
  };

  const handleRemoveAll = () => {
    onRemoveAll();
  };

  // Calcula o tamanho total de todos os arquivos
  const calculateTotalSize = () => {
    const totalKB = pdfFiles.reduce((total, file) => total + parseFloat(file.size), 0);
    return formatFileSize(totalKB.toFixed(2));
  };

  if (pdfFiles.length === 0) {
    return (
      <div className="list-section">
        <div className="list-header">
          <h2>Arquivos Importados</h2>
        </div>
        <p className="empty-message">Nenhum arquivo PDF importado</p>
      </div>
    );
  }

  return (
    <div className="list-section">
      <div className="list-header">
        <h2>Arquivos Importados</h2>
        <div className="list-actions">
          <button 
            onClick={handleDownloadAll}
            className="download-all-button"
            title="Baixar todos os arquivos"
          >
            <span className="download-icon">📥</span>
            Baixar Todos
          </button>
          <button 
            onClick={handleRemoveAll}
            className="remove-all-button"
            title="Remover todos os arquivos"
          >
            <span className="remove-icon">🗑️</span>
            Remover Todos
          </button>
        </div>
      </div>
      
      <div className="pdf-list">
        {pdfFiles.map((file) => (
          <div key={file.id} className="pdf-item">
            <div className="pdf-info">
              <span className="pdf-name">{file.name}</span>
              <span className="pdf-details">
                {formatFileSize(file.size)} • {file.uploadDate}
                {file.agente && <span className="agente-tag"> • Agente: {file.agente}</span>}
                {file.numeroProcesso && <span className="processo-tag"> • Processo: {file.numeroProcesso}</span>}
              </span>
            </div>
            <div className="pdf-actions">
              <button 
                onClick={() => handleDownloadFile(file)}
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
          <span>Total: {calculateTotalSize()}</span>
        </div>
      </div>
    </div>
  );
};

export default FileList;