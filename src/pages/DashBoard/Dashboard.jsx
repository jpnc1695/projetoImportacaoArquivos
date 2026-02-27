import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import agentesData from '/src/Api/agentes.json';
import FileList from '../../Components/FileList/FileList';
import ImportarArquivos from '../../Components/ImportarArquivos/ImportarArquivos'; // ajuste o caminho
import './Dashboard.css';

// Funções auxiliares que ainda são necessárias (base64ToBlob)
const base64ToBlob = (base64) => {
  // (mesma implementação anterior)
  try {
    if (!base64 || typeof base64 !== 'string') {
      throw new Error('Base64 inválido');
    }
    let mimeType = 'application/octet-stream';
    let base64Data = base64;
    if (base64.includes(',')) {
      const parts = base64.split(',');
      const mimeMatch = parts[0].match(/:(.*?);/);
      if (mimeMatch) {
        mimeType = mimeMatch[1];
      }
      base64Data = parts[1];
    }
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: 'application/pdf' });
  } catch (error) {
    console.error('Erro ao converter base64 para blob:', error);
    throw error;
  }
};

function Dashboard({ username, userId, onLogout }) {
  console.log('Dashboard renderizado com userId:', userId);
  const [pdfFiles, setPdfFiles] = useState([]);
  const [agentes, setAgentes] = useState([]);
  const navigate = useNavigate();

  // Carrega os arquivos salvos no localStorage
  useEffect(() => {
    const loadSavedFiles = async () => {
      const saved = localStorage.getItem('pdfiles_base64');
      if (saved) {
        try {
          const filesData = JSON.parse(saved);
          const userFiles = filesData.filter(file => file.userId === userId);
          setPdfFiles(userFiles);
        } catch (error) {
          console.error('Erro ao carregar arquivos:', error);
        }
      }
    };
    loadSavedFiles();
  }, [userId]);

  // Carrega os agentes do JSON
  useEffect(() => {
    if (agentesData && agentesData.agentes) {
      setAgentes(agentesData.agentes);
    } else {
      console.error('Formato do JSON inválido. Esperado: { agentes: [...] }');
    }
  }, []);

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  // Callback chamado quando o upload é concluído
  const handleUploadComplete = (newFiles) => {
    const updatedFiles = [...pdfFiles, ...newFiles];
    setPdfFiles(updatedFiles);
    localStorage.setItem('pdfiles_base64', JSON.stringify(updatedFiles));
  };

  // Funções de download e remoção (inalteradas)
  const handleDownload = (file) => {
    try {
      if (file.base64Data) {
        const blob = base64ToBlob(file.base64Data);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 100);
      } else {
        alert('Arquivo corrompido ou inválido');
      }
    } catch (error) {
      console.error('Erro no download:', error);
      alert('Erro ao baixar arquivo');
    }
  };

  const handleDownloadAll = async (filesToDownload) => {
    // (mesma implementação anterior)
    if (!filesToDownload || filesToDownload.length === 0) {
      alert('Não há arquivos para download');
      return;
    }
    if (filesToDownload.length > 5) {
      const confirm = window.confirm(
        `Baixar ${filesToDownload.length} arquivos?\n\n` +
        'Os arquivos serão baixados um por vez com intervalo de 500ms.'
      );
      if (!confirm) return;
    }
    let successCount = 0;
    let errorCount = 0;
    for (let i = 0; i < filesToDownload.length; i++) {
      const file = filesToDownload[i];
      try {
        const fileObject = file.fileData;
        if (!fileObject) {
          throw new Error('Dados do arquivo não encontrados');
        }
        const url = URL.createObjectURL(fileObject);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 100);
        successCount++;
        if (i < filesToDownload.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error(`Erro ao baixar ${file.name}:`, error);
        errorCount++;
      }
    }
    alert(`${successCount} arquivo(s) baixado(s) com sucesso${errorCount > 0 ? `, ${errorCount} falha(s)` : ''}`);
  };

  const handleRemoveFile = (id) => {
    const updatedFiles = pdfFiles.filter(file => file.id !== id);
    setPdfFiles(updatedFiles);
    const allFiles = JSON.parse(localStorage.getItem('pdfiles_base64') || '[]');
    const otherUsersFiles = allFiles.filter(file => file.userId !== userId);
    const newAllFiles = [...otherUsersFiles, ...updatedFiles];
    localStorage.setItem('pdfiles_base64', JSON.stringify(newAllFiles));
  };

  const handleRemoveAllFiles = (filesToRemove) => {
    const files = filesToRemove || pdfFiles;
    if (window.confirm(`Tem certeza que deseja remover todos os ${files.length} arquivo(s)?`)) {
      const remainingFiles = filesToRemove
        ? pdfFiles.filter(file => !filesToRemove.some(f => f.id === file.id))
        : [];
      setPdfFiles(remainingFiles);
      const allFiles = JSON.parse(localStorage.getItem('pdfiles_base64') || '[]');
      const otherUsersFiles = allFiles.filter(file => file.userId !== userId);
      const newAllFiles = [...otherUsersFiles, ...remainingFiles];
      localStorage.setItem('pdfiles_base64', JSON.stringify(newAllFiles));
    }
  };

  const formatFileSize = (sizeInKB) => {
    if (sizeInKB < 1024) {
      return `${sizeInKB} KB`;
    } else {
      return `${(sizeInKB / 1024).toFixed(2)} MB`;
    }
  };

  const handleStatusChange = (id, status, reason) => {
    setPdfFiles(prev =>
      prev.map(file =>
        file.id === id
          ? { ...file, status, rejectionReason: status === 'reprovado' ? reason : null }
          : file
      )
    );
  };
  
  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="dashboard-box">
          <div className="dashboard-header">
            <div className="header-with-logout">
              <h1>Gerenciador de Arquivos</h1>
              <div className="header-buttons">
                <button onClick={() => navigate('/registrar')} className="acount-button">
                  Criar Conta
                </button>
                <button onClick={() => navigate('/admin')} className="admin-button">
                  Administração
                </button>
                <button onClick={handleLogout} className="logout-button">
                  Sair
                </button>
              </div>
            </div>
            <p>Bem-vindo, {username}!</p>
          </div>

          {/* Componente de upload extraído */}
          <ImportarArquivos
            agentes={agentes}
            userId={userId}
            onUploadComplete={handleUploadComplete}
          />

          {/* Componente FileList */}
          <FileList
            pdfFiles={pdfFiles}
            onDownload={handleDownload}
            onRemove={handleRemoveFile}
            onDownloadAll={handleDownloadAll}
            onRemoveAll={handleRemoveAllFiles}
            formatFileSize={formatFileSize}
            onStatusChange={handleStatusChange}
          />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;