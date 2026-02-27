import React from 'react';
import './CaixaDeDialogo.css'; // Vamos criar o CSS separadamente

const CaixaDeDialogo = ({ isOpen, onClose, onConfirm, fileName }) => {
  const [showReason,setshowReason] = React.useState(false);
  const [reason,setReason] = React.useState('');

  if (!isOpen) return null;

  const handleReprovarClick = () => {
    setshowReason(true);
  };

  const handleConfirmReprovacao  = () => {
    if(showReason && reason.trim() === '') {
      alert('Por favor, forneça um motivo para reprovar o arquivo.');
      return;
    }
    onConfirm('reprovado', reason);
    setshowReason(false);
    setReason('');
    onClose();
  }

  const handleCancel = () => {
    setshowReason(false);
    setReason('');
    onClose();
  };

  return (
    <div className="dialog-overlay" onClick={handleCancel}>
      <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
        <h3>Alterar Status</h3>
        {fileName && <p className="file-name">Arquivo: {fileName}</p>}

        {!showReason ? (
          // Estado inicial: escolher status
          <>
            <p>Você deseja alterar o status do arquivo?</p>
            <div className="dialog-actions">
              <button
                className="dialog-button approve"
                onClick={() => {
                  onConfirm('aprovado');
                  onClose();
                }}
              >
                Aprovado
              </button>
              <button
                className="dialog-button reject"
                onClick={handleReprovarClick}
              >
                Reprovado
              </button>
              <button className="dialog-button cancel" onClick={handleCancel}>
                Cancelar
              </button>
            </div>
          </>
        ) : (
          // Estado de motivo para reprovação
          <>
            <p>Informe o motivo da reprovação:</p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Digite o motivo..."
              rows={3}
              className="dialog-reason-input"
              autoFocus
            />
            <div className="dialog-actions">
              <button
                className="dialog-button reject"
                onClick={handleConfirmReprovacao}
              >
                Confirmar Reprovação
              </button>
              <button className="dialog-button cancel" onClick={handleCancel}>
                Cancelar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CaixaDeDialogo;