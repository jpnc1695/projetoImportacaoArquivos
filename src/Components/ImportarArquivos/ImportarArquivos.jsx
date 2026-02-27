// FileUploader.js
import React, { useState } from 'react';
import './ImportarArquivos.css';

// Funções auxiliares
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};

const formatFileSize = (sizeInKB) => {
  if (sizeInKB < 1024) {
    return `${sizeInKB} KB`;
  } else {
    return `${(sizeInKB / 1024).toFixed(2)} MB`;
  }
};

const ImportarArquivos = ({ agentes, userId, onUploadComplete }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [processNumber, setProcessNumber] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      setSelectedFiles(files);
      setValidationErrors((prev) => ({ ...prev, files: null }));
    } else {
      setSelectedFiles([]);
      event.target.value = null;
    }
  };

  const validateFields = () => {
    const errors = {};
    if (!selectedAgent) {
      errors.agent = 'Selecione um agente';
    }
    if (!processNumber || processNumber.trim() === '') {
      errors.process = 'O número do processo é obrigatório';
    } else if (processNumber.trim().length < 5) {
      errors.process = 'O número do processo deve ter pelo menos 5 caracteres';
    }
    if (selectedFiles.length === 0) {
      errors.files = 'Selecione pelo menos um arquivo';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpload = async () => {
    if (!validateFields()) return;
    setIsUploading(true);

    try {
      const newFiles = await Promise.all(
        selectedFiles.map(async (file) => {
          const base64Data = await fileToBase64(file);
          return {
            id: Date.now() + Math.random(),
            name: file.name,
            size: (file.size / 1024).toFixed(2),
            uploadDate: new Date().toLocaleDateString('pt-BR'),
            base64Data,
            agente: selectedAgent,
            numeroProcesso: processNumber,
            userId: userId,
            status: 'pendente'
          };
        })
      );

      onUploadComplete(newFiles);

      // Limpar formulário
      setSelectedFiles([]);
      setSelectedAgent('');
      setProcessNumber('');
      setValidationErrors({});

      const input = document.getElementById('pdf-upload');
      if (input) input.value = '';

      alert(`${newFiles.length} arquivo(s) importado(s) com sucesso!`);
    } catch (error) {
      console.error('Erro no upload:', error);
      alert('Erro ao importar arquivos. Tente novamente.');
    } finally {
      setIsUploading(false);
    }
  };

  const clearSelectedFiles = () => {
    setSelectedFiles([]);
    const input = document.getElementById('pdf-upload');
    if (input) input.value = '';
  };

  const getSelectedAgentName = () => {
    const agent = agentes.find(a => a.name === selectedAgent);
    return agent ? `${agent.name} (${agent.username})` : selectedAgent;
  };

  const getTotalSelectedSize = () => {
    const totalKB = selectedFiles.reduce((total, file) => total + file.size / 1024, 0);
    return formatFileSize(totalKB.toFixed(2));
  };

  return (
    <div className="upload-section">
      <h2><strong>Importar Arquivo</strong></h2>
      <div className="upload-container">
        <input
          type="file"
          id="pdf-upload"
          accept="*/*"
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
              setSelectedAgent(e.target.value);
              setValidationErrors((prev) => ({ ...prev, agent: null }));
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
        </div>

        <div className="processo-selector">
          <label htmlFor="processo-number"><strong>Nº do processo:</strong></label>
          <input
            type="text"
            id="processo-number"
            value={processNumber}
            onChange={(e) => {
              setProcessNumber(e.target.value);
              setValidationErrors((prev) => ({ ...prev, process: null }));
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
  );
};

export default ImportarArquivos;