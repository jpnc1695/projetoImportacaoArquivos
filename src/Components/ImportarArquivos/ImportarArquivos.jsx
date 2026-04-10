// FileUploader.js
import React, { useState } from 'react';
import './ImportarArquivos.css';
import { supabase } from '../../supabaseClient';



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
  const [processType, setProcessType] = useState('Packing'); // valor padrão

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
    if (!userId) {
      alert('Usuário não identificado. Faça login novamente.');
      return;
    }

    setIsUploading(true);
    const uploadedRecords = [];

    try {
      for (const file of selectedFiles) {
        // 1. Gerar caminho único no bucket: user_id/processNumber_timestamp_random.ext
        const fileExt = file.name.split('.').pop();
        const safeProcessNumber = processNumber.trim().replace(/[^a-zA-Z0-9]/g, '_');
        const fileName = `${userId}/${safeProcessNumber}_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

        // 2. Upload para o Storage (bucket 'pdf-uploads')
        const { error: uploadError } = await supabase.storage
          .from('pdf-uploads')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // 3. Inserir metadados na tabela 'arquivos'
        const { data: inserted, error: dbError } = await supabase
          .from('arquivos')
          .insert({
            user_id: userId,
            name: file.name,
            size_kb: (file.size / 1024).toFixed(2),
            status: 'pendente',
            storage_path: fileName,
            agenteId: agentes.find(a => a.name === selectedAgent)?.id || null,
            processo: processNumber.trim(),
            tipodearquivo: processType,
            created_at: new Date().toISOString(),
          })
          .select();

        if (dbError) throw dbError;

        uploadedRecords.push(inserted[0]);
      }

      // Notifica o Dashboard com os registros inseridos
      onUploadComplete(uploadedRecords);

      // Limpar formulário
      setSelectedFiles([]);
      setSelectedAgent('');
      setProcessNumber('');
      setValidationErrors({});
      setProcessType('packing');
      const input = document.getElementById('pdf-upload');
      if (input) input.value = '';

      alert(`${uploadedRecords.length} arquivo(s) enviado(s) com sucesso!`);
    } catch (error) {
      console.error('Erro no upload:', error);
      alert(`Erro ao enviar: ${error.message}`);
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

  
        <div className="processo-selector">
          <label htmlFor="processo-number"><strong>Selecione o tipo do Arquivo</strong></label>
          <select
            id="processo-tipo"
            value={processType}
            onChange={(e) => setProcessType(e.target.value)}
          >
            <option value="packing">Packing</option>
            <option value="sortimento">Sortimento</option>
          </select>
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

              {processType && (
                <p><strong>Tipo de arquivo:</strong> {processType}</p>
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