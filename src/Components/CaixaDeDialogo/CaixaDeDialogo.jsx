import React from 'react';
import './CaixaDeDialogo.css'; // Vamos criar o CSS separadamente

const CaixaDeDialogo = ({ isOpen, onClose, onConfirm, fileName }) => {
  if (!isOpen) return null;

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
        <h3>Alterar Status</h3>
        <p>Você deseja alterar o status do pedido?</p>
        {fileName && <p className="file-name">Arquivo: {fileName}</p>}
        <div className="dialog-actions">
          <button 
            className="dialog-button approve" 
            onClick={() => onConfirm('aprovado')}
          >
            Aprovado
          </button>
          <button 
            className="dialog-button reject" 
            onClick={() => onConfirm('reprovado')}
          >
            Reprovado
          </button>
          <button className="dialog-button cancel" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CaixaDeDialogo;