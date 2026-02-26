// FileList.js
import React, { useState, useMemo } from 'react';
import './FileList.css';

const FileList = ({ pdfFiles, onDownload, onRemove, onDownloadAll, onRemoveAll, formatFileSize }) => {
  const [filters, setFilters] = useState({
    agente: '',
    processo: ''
  });
  
  const [showFilters, setShowFilters] = useState(false);

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
    
    return { agentes, processos };
  }, [pdfFiles]);

  // Aplica os filtros aos arquivos - corrigido
  const filteredFiles = useMemo(() => {
    console.log('Aplicando filtros:', filters); // Para debug
    console.log('Arquivos totais:', pdfFiles); // Para debug
    
    return pdfFiles.filter(file => {
      // Filtro por agente
      const matchAgente = !filters.agente || 
        (file.agente && file.agente === filters.agente);
      
      // Filtro por processo
      const matchProcesso = !filters.processo || 
        (file.numeroProcesso && file.numeroProcesso === filters.processo);
      
      console.log(`Arquivo: ${file.name}`, { 
        agente: file.agente, 
        matchAgente, 
        processo: file.numeroProcesso, 
        matchProcesso 
      }); // Para debug
      
      return matchAgente && matchProcesso;
    });
  }, [pdfFiles, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    console.log(`Mudando filtro ${name} para:`, value); // Para debug
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({ agente: '', processo: '' });
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

  // Calcula o tamanho total dos arquivos filtrados
  const calculateTotalSize = () => {
    if (filteredFiles.length === 0) return formatFileSize('0');
    const totalKB = filteredFiles.reduce((total, file) => total + parseFloat(file.size), 0);
    return formatFileSize(totalKB.toFixed(2));
  };

  // Verifica se há filtros ativos
  const hasActiveFilters = filters.agente || filters.processo;

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
          ))
        )}
        
        {filteredFiles.length > 0 && (
          <div className="pdf-stats">
            <span>Total: {filteredFiles.length} arquivo(s)</span>
            <span>Total: {calculateTotalSize()}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileList;