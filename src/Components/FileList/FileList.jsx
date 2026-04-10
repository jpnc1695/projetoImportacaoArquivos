// FileList.js
import React, { useState, useMemo, useEffect } from 'react';
import CaixaDeDialogo from '../CaixaDeDialogo/CaixaDeDialogo';
import { supabase } from '../../supabaseClient';

import './FileList.css';

const FileList = ({ pdfFiles, onDownload, onRemove,  onRemoveAll, formatFileSize, onStatusChange, onDownloadSelected, userOrigem, userAgenteId }) => {
  const [filters, setFilters] = useState({
    agente: '',
    processo: '',
    status: '',
    tipoArquivo: ''
  });

  console.log('FileList renderizado com:', {  userOrigem, userAgenteId });
  console.log('Arquivos recebidos:', pdfFiles);
  const [showFilters, setShowFilters] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());

  useEffect(() => {
    setSelectedIds(new Set());
  }, [filters]);

  // 🔹 1. Filtra os arquivos com base no tipo de usuário (agente ou não)
  const accessibleFiles = useMemo(() => {
    if (userOrigem === 'agente') {
      // Se for agente, mantém apenas os arquivos relacionados ao seu ID
      return pdfFiles.filter(file => file.agenteId && String(file.agenteId) === String(userAgenteId));
    }
    // Caso contrário (admin, etc.), exibe todos os arquivos
    return pdfFiles;
  }, [pdfFiles, userOrigem, userAgenteId]);

  // Extrai valores únicos para os filtros - usando apenas os arquivos acessíveis
  const uniqueValues = useMemo(() => {
    const agentes = [...new Set(
      accessibleFiles
        .map(file => file.agente)
        .filter(agente => agente && agente !== 'Não atribuído')
    )].sort();

    const processos = [...new Set(
      accessibleFiles
        .map(file => file.processo)
        .filter(processo => processo && processo !== 'Não informado')
    )].sort();

    const tipoArquivo = [...new Set(
      accessibleFiles
        .map(file => file.tipodearquivo)
        .filter(value => value && value !== 'Não informado')
    )];

    return { agentes, processos, tipoArquivo };
  }, [accessibleFiles]);

  // Aplica os filtros de UI sobre a lista de arquivos acessíveis
  const filteredFiles = useMemo(() => {
    return accessibleFiles.filter(file => {
      const matchAgente = !filters.agenteId ||
        (file.agenteId && file.agenteId === filters.agenteId);

      const matchProcesso = !filters.processo ||
        (file.numeroProcesso && file.numeroProcesso === filters.processo);

      const matchStatus = !filters.status ||
        (file.status && file.status === filters.status);

      const matchTipo = !filters.tipoArquivo ||
        (file.tipoArquivo && file.tipoArquivo === filters.tipoArquivo.toLowerCase());

      return matchAgente && matchProcesso && matchStatus && matchTipo;
    });
  }, [accessibleFiles, filters]);

  // ... (restante das funções: handleStatusClick, handleDialogConfirm, etc., inalteradas)
  const handleStatusClick = (file) => {
    setSelectedFile(file);
    setDialogOpen(true);
  };

  const handleDialogConfirm = (status, reason) => {
    if (selectedFile && onStatusChange) {
      onStatusChange(selectedFile.id, status, reason);
    }
    setDialogOpen(false);
    setSelectedFile(null);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedFile(null);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({ agente: '', processo: '', status: '', tipoArquivo: '' });
  };

  const handleDownloadFile = async  (file) => {
    try {
      // Baixa o arquivo como blob
      const { data, error } = await supabase.storage
        .from('pdf-uploads')
        .download(file.storagePath);
  
      if (error) throw error;
  
      // Cria URL do blob e força o download
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;      // nome do arquivo
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);       // libera memória
    } catch (error) {
      console.error('Erro no download:', error);
      alert('Erro ao baixar arquivo');
    }
  };

  const handleRemoveFile = (id) => {
    if (window.confirm('Tem certeza que deseja remover este arquivo?')) {
      onRemove(id);
    }
  };

  const handleDownloadAll = async (filteredFiles) => {
    if (!filesToDownload.length) {
      alert('Não há arquivos para download');
      return;
    }
  
    if (filesToDownload.length > 5 && !window.confirm(`Baixar ${filesToDownload.length} arquivos?`)) {
      return;
    }
  
    try {
      const zip = new JSZip();
  
      for (const file of filesToDownload) {
        const { data, error } = await supabase.storage
          .from('pdf-uploads')
          .download(file.storagePath);
  
        if (error) throw error;
        zip.file(file.name, data);
      }
  
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `arquivos_${Date.now()}.zip`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 100);
      alert(`${filesToDownload.length} arquivo(s) baixado(s) com sucesso`);
    } catch (error) {
      console.error('Erro ao criar ZIP:', error);
      alert('Erro ao baixar múltiplos arquivos');
    }
  };

/*   const handleDownloadAll = () => {
    onDownloadAll(filteredFiles);
  };
 */
  const handleRemoveAll = () => {
    if (window.confirm(`Tem certeza que deseja remover todos os ${filteredFiles.length} arquivo(s) mostrados?`)) {
      onRemoveAll(filteredFiles);
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      'pendente': 'Pendente',
      'aprovado': 'Aprovado',
      'reprovado': 'Reprovado'
    };
    return statusMap[status] || 'Pendente';
  };

  const calculateTotalSize = () => {
    if (filteredFiles.length === 0) return formatFileSize('0');
    const totalKB = filteredFiles.reduce((total, file) => total + parseFloat(file.size), 0);
    return formatFileSize(totalKB.toFixed(2));
  };

  const hasActiveFilters = filters.agente || filters.processo || filters.status || filters.tipoArquivo;

  // 🔹 2. Mensagem quando não há arquivos acessíveis (nem mesmo antes dos filtros)
  if (accessibleFiles.length === 0) {
    return (
      <div className="list-section">
        <div className="list-header">
          <h2>Arquivos Importados</h2>
        </div>
        <p className="empty-message">
          {userOrigem === 'agente'
            ? 'Nenhum arquivo associado a este agente foi encontrado.'
            : 'Nenhum arquivo importado'}
        </p>
      </div>
    );
  }

  return (
    <div className="list-section">
      <div className="list-header">
        <div className="header-title">
          <h2>Arquivos Importados</h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="filter-toggle-button"
            title={showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
          >
            <span className="filter-icon">🔍</span>
            {showFilters ? 'Ocultar Filtros' : 'Filtrar'}
            {hasActiveFilters && <span className="active-filter-indicator">●</span>}
          </button>
        </div>
        <div className="list-actions">
          <button
            onClick={() => {
              const selectedFiles = Array.from(selectedIds).map(id =>
                accessibleFiles.find(f => f.id === id)
              );
              if (onDownloadSelected) {
                onDownloadSelected(selectedFiles);
              } else {
                selectedFiles.forEach(file => onDownload(file));
              }
            }}
            disabled={selectedIds.size === 0}
            className="download-selected-button"
            title="Baixar arquivos selecionados"
          >
            <span className="download-icon">📥</span>
            Baixar Selecionados ({selectedIds.size})
          </button>

          <button
            onClick={handleDownloadAll}
            className="download-all-button"
            title="Baixar todos os arquivos"
            disabled={filteredFiles.length === 0}
          >
            <span className="download-icon">📥</span>
            Baixar Todos
          </button>

          <button
            onClick={handleRemoveAll}
            className="remove-all-button"
            title="Remover todos os arquivos"
            disabled={filteredFiles.length === 0}
          >
            <span className="remove-icon">🗑️</span>
            Remover Todos
          </button>
        </div>
      </div>

      {/* Painel de Filtros */}
      {showFilters && (
        <div className="filters-panel">
          <div className="filters-container">
            <div className="filter-group">
              <label htmlFor="filter-agente">Filtrar por Agente:</label>
              <select
                id="filter-agente"
                name="agente"
                value={filters.agente}
                onChange={handleFilterChange}
                className="filter-select"
              >
                <option value="">Todos os agentes</option>
                {uniqueValues.agentes.map(agente => (
                  <option key={agente} value={agente}>
                    {agente}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="filter-processo">Filtrar por Processo:</label>
              <select
                id="filter-processo"
                name="processo"
                value={filters.processo}
                onChange={handleFilterChange}
                className="filter-select"
              >
                <option value="">Todos os processos</option>
                {uniqueValues.processos.map(processo => (
                  <option key={processo} value={processo}>
                    {processo}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="filter-tipoArquivo">Filtrar por tipo de arquivo:</label>
              <select
                id="filter-tipoArquivo"
                name="tipoArquivo"
                value={filters.tipoArquivo}
                onChange={handleFilterChange}
                className="filter-select"
              >
                <option value="">Todos os Arquivos</option>
                {uniqueValues.tipoArquivo.map(tipo => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="filter-status">Filtrar por Status:</label>
              <select
                id="filter-status"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="filter-select"
              >
                <option value="">Todos os status</option>
                <option value="pendente">Pendente</option>
                <option value="aprovado">Aprovado</option>
                <option value="reprovado">Reprovado</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button onClick={clearFilters} className="clear-filters-button">
                <span className="clear-icon">✕</span>
                Limpar Filtros
              </button>
            )}
          </div>

          <div className="filter-results-info">
            Mostrando {filteredFiles.length} de {accessibleFiles.length} arquivo(s)
          </div>
        </div>
      )}

      <div className="pdf-list">
        {filteredFiles.length === 0 ? (
          <div className="no-results-message">
            <p>Nenhum arquivo encontrado com os filtros selecionados.</p>
            <button onClick={clearFilters} className="clear-filters-link">
              Limpar filtros
            </button>
          </div>
        ) : (
          filteredFiles.map((file) => (
            <div key={file.id} className="pdf-item">
              <input
                type="checkbox"
                checked={selectedIds.has(file.id)}
                onChange={(e) => {
                  const newSelected = new Set(selectedIds);
                  if (e.target.checked) {
                    newSelected.add(file.id);
                  } else {
                    newSelected.delete(file.id);
                  }
                  setSelectedIds(newSelected);
                }}
              />

              <div className="pdf-info">
                <div className="pdf-header">
                  <span className="pdf-name">{file.name}</span>
                  <div className="pdf-meta">
                    <span>{formatFileSize(file.size)} • {file.uploadDate}</span>
                  </div>
                </div>

                <div className="pdf-extra-info">
                  {file.agenteId && file.agenteId !== 'Não atribuído' && (
                    <span className="agente-tag">👤 Agente: {file.agenteId}</span>
                  )}
                  {file.processo && file.processo !== 'Não informado' && (
                    <span className="processo-tag">📁 Processo: {file.processo}</span>
                  )}
                  {file.tipodearquivo && file.tipodearquivo !== 'Não informado' && (
                    <span className="tipoArquivo-tag">📄 Tipo: {file.tipodearquivo}</span>
                  )}
                  {file.status === 'reprovado' && file.rejectionReason && (
                    <span className="rejection-reason-tag">⚠️ Motivo: {file.rejectionReason}</span>
                  )}
                </div>
              </div>

              <div className="pdf-actions">
                <button
                  onClick={() => handleStatusClick(file)}
                  className={`status-button-single ${file.status || 'pendente'}`}
                  title="Clique para alterar o status"
                >
                  {getStatusText(file.status)}
                </button>

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
          ))
        )}
        {filteredFiles.length > 0 && (
          <div className="pdf-stats">
            <span>Total: {filteredFiles.length} arquivo(s)</span>
            <span>Total: {calculateTotalSize()}</span>
          </div>
        )}
      </div>

      <CaixaDeDialogo
        isOpen={dialogOpen}
        onClose={handleDialogClose}
        onConfirm={handleDialogConfirm}
        fileName={selectedFile?.name}
      />
    </div>
  );
};

export default FileList;