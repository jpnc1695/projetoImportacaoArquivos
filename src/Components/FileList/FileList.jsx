// FileList.js
import React, { useState, useMemo, useEffect } from 'react';
import CaixaDeDialogo from '../CaixaDeDialogo/CaixaDeDialogo';
import './FileList.css';

const FileList = ({ pdfFiles, onDownload, onRemove, onDownloadAll, onRemoveAll, formatFileSize, onStatusChange, onDownloadSelected  }) => {
  const [filters, setFilters] = useState({
    agente: '',
    processo: '',
    status: '',
    tipoArquivo: ''
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());


  useEffect(() => {
    setSelectedIds(new Set());
  }, [filters]);

  // Extrai valores únicos para os filtros - com tratamento de null/undefined
  const uniqueValues = useMemo(() => {
    const agentes = [...new Set(
      pdfFiles
        .map(file => file.agente)
        .filter(agente => agente && agente !== 'Não atribuído')
    )].sort();
    
    const processos = [...new Set(
      pdfFiles
        .map(file => file.numeroProcesso)
        .filter(processo => processo && processo !== 'Não informado')
    )].sort();
    

    const tipoArquivo = [...new Set(
      pdfFiles
        .map(file => file.tipoArquivo)
        .filter(tipoArquivo => tipoArquivo && tipoArquivo !== 'Não informado')
    )].sort();


    return { agentes, processos, tipoArquivo };
  }, [pdfFiles]);

  // Aplica os filtros aos arquivos - corrigido
  const filteredFiles = useMemo(() => {
    return pdfFiles.filter(file => {
      const matchAgente = !filters.agente || 
        (file.agente && file.agente === filters.agente);
      
      const matchProcesso = !filters.processo || 
        (file.numeroProcesso && file.numeroProcesso === filters.processo);
      
      // 👇 Adiciona filtro por status
      const matchStatus = !filters.status || 
        (file.status && file.status === filters.status);

      const matchTipo = !filters.tipoArquivo || 
        (file.tipoArquivo && file.tipoArquivo === filters.tipoArquivo.toLocaleLowerCase());
      
      return matchAgente && matchProcesso && matchStatus && matchTipo;
    });
  }, [pdfFiles, filters]);

  const handleStatusClick = (file) => {
    setSelectedFile(file);
    setDialogOpen(true);
  };

  // Callback chamado quando o usuário escolhe um status no diálogo
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
    console.log(`Mudando filtro ${name} para:`, value); // Para debug
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({ agente: '', processo: '', status: '' });
  };

  const handleDownloadFile = (file) => {
    onDownload(file);
  };

  const handleRemoveFile = (id) => {
    if (window.confirm('Tem certeza que deseja remover este arquivo?')) {
      onRemove(id);
    }
  };

  const handleDownloadAll = () => {
    onDownloadAll(filteredFiles);
  };

  const handleRemoveAll = () => {
    if (window.confirm(`Tem certeza que deseja remover todos os ${filteredFiles.length} arquivo(s) mostrados?`)) {
      onRemoveAll(filteredFiles); // Passa apenas os arquivos filtrados
    }
  };

  // Função para obter o texto do status
  const getStatusText = (status) => {
    const statusMap = {
      'pendente': 'Pendente',
      'aprovado': 'Aprovado',
      'reprovado': 'Reprovado'
    };
    return statusMap[status] || 'Pendente';
  };
  // Calcula o tamanho total dos arquivos filtrados
  const calculateTotalSize = () => {
    if (filteredFiles.length === 0) return formatFileSize('0');
    const totalKB = filteredFiles.reduce((total, file) => total + parseFloat(file.size), 0);
    return formatFileSize(totalKB.toFixed(2));
  };

  // Verifica se há filtros ativos
  const hasActiveFilters = filters.agente || filters.processo || filters.status || filters.tipoArquivo;

  if (pdfFiles.length === 0) {
    return (
      <div className="list-section">
        <div className="list-header">
          <h2>Arquivos Importados</h2>
        </div>
        <p className="empty-message">Nenhum arquivo importado</p>
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
                pdfFiles.find(f => f.id === id)
              );
              // Se você tem uma prop específica para baixar múltiplos arquivos selecionados:
              if (onDownloadSelected) {
                onDownloadSelected(selectedFiles);
              } else {
                // Fallback: chama onDownload para cada arquivo (ou use onDownloadAll)
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

             {/* Novo filtro por status */}
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
            Mostrando {filteredFiles.length} de {pdfFiles.length} arquivo(s)
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
                <span className="pdf-name">{file.name}</span>
                <span className="pdf-details">
                  {formatFileSize(file.size)} • {file.uploadDate}
                  {file.agente && file.agente !== 'Não atribuído' && (
                    <span className="agente-tag"> • Agente: {file.agente}</span>
                  )}
                  {file.numeroProcesso && file.numeroProcesso !== 'Não informado' && (
                    <span className="processo-tag"> • Processo: {file.numeroProcesso}</span>
                  )}

                  {file.tipoArquivo && file.tipoArquivo !== 'Não informado' && (
                    <span className="tipoArquivo-tag"> • Tipo de Arquivo: {file.tipoArquivo}</span>
                  )}

                {file.status === 'reprovado' && file.rejectionReason && (
                    <span className="rejection-reason-tag"> • Motivo: {file.rejectionReason}</span>
                  )}
                </span>
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