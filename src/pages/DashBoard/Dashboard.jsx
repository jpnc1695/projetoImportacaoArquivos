import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import JSZip from 'jszip';
import { supabase } from '../../supabaseClient';
import FileList from '../../Components/FileList/FileList';
import ImportarArquivos from '../../Components/ImportarArquivos/ImportarArquivos';
import './Dashboard.css';

function Dashboard({ username, userId, onLogout, userOrigem, userAgenteId }) {
  const [pdfFiles, setPdfFiles] = useState([]);
  const [agentes, setAgentes] = useState([]);
  const navigate = useNavigate();

  // Carrega os arquivos do Supabase
  useEffect(() => {
    const loadFiles = async () => {
      if (!userId) return;

      const { data, error } = await supabase
        .from('arquivos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar arquivos:', error);
        return;
      }

      // Converter cada registro para o formato esperado pelo FileList
      setPdfFiles(data);
    };

    loadFiles();
  }, [userId]);

  // Carrega agentes (pode vir do Supabase também, mas mantemos o JSON por simplicidade)
  const fetchAgents = async () => {
    const { data, error } = await supabase
      .from('agentes')
      .select('*')
      .order('id');
    if (!error) setAgentes(data);
  };

    useEffect(() => {
      fetchAgents();
    }, []);

    


  const handleLogout = () => {
    localStorage.removeItem('authToken');
    onLogout();
    navigate('/');
  };

  // Callback chamado após upload bem-sucedido (o ImportarArquivos já deve salvar no Supabase)
  const handleUploadComplete = (newFiles) => {
    // newFiles já devem ser os registros vindos do Supabase (com id, storagePath, etc.)
    setPdfFiles(prev => [...newFiles, ...prev]);
  };

  // Download de um único arquivo (gera URL assinada)
  const handleDownload = async (file) => {
    try {
      const { data, error } = await supabase.storage
        .from('pdf-uploads')
        .createSignedUrl(file.storagePath, 60); // URL válida por 60 segundos

      if (error) throw error;

      const link = document.createElement('a');
      link.href = data.signedUrl;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erro no download:', error);
      alert('Erro ao baixar arquivo');
    }
  };

  // Download de múltiplos arquivos (gera ZIP)
  const handleDownloadAll = async (filesToDownload) => {
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

  // Remover um arquivo (Storage + tabela)
  const handleRemoveFile = async (id) => {
    const fileToRemove = pdfFiles.find(f => f.id === id);
    if (!fileToRemove) return;

    // Confirmação
    if (!window.confirm(`Remover "${fileToRemove.name}" permanentemente?`)) return;

    try {
      // 1. Remove do Storage
      const { error: storageError } = await supabase.storage
        .from('pdf-uploads')
        .remove([fileToRemove.storagePath]);

      if (storageError) throw storageError;

      // 2. Remove registro da tabela
      const { error: dbError } = await supabase
        .from('arquivos')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      // 3. Atualiza estado local
      setPdfFiles(prev => prev.filter(f => f.id !== id));
    } catch (error) {
      console.error('Erro ao remover arquivo:', error);
      alert('Erro ao remover arquivo');
    }
  };

  // Remover todos os arquivos selecionados
  const handleRemoveAllFiles = async (filesToRemove) => {
    const files = filesToRemove || pdfFiles;
    if (!files.length) return;
    if (!window.confirm(`Remover todos os ${files.length} arquivo(s)?`)) return;

    try {
      // Remove todos do Storage
      const paths = files.map(f => f.storagePath);
      const { error: storageError } = await supabase.storage
        .from('pdf-uploads')
        .remove(paths);
      if (storageError) throw storageError;

      // Remove registros da tabela (ids)
      const ids = files.map(f => f.id);
      const { error: dbError } = await supabase
        .from('arquivos')
        .delete()
        .in('id', ids);
      if (dbError) throw dbError;

      // Atualiza estado
      setPdfFiles(prev => prev.filter(f => !ids.includes(f.id)));
    } catch (error) {
      console.error('Erro ao remover todos:', error);
      alert('Erro ao remover arquivos');
    }
  };

  // Atualizar status (aprovado/reprovado) - usado pelo FileList
  const handleStatusChange = async (id, status, reason) => {
    try {
      const { error } = await supabase
        .from('arquivos')
        .update({ status, rejection_reason: status === 'reprovado' ? reason : null })
        .eq('id', id);

      if (error) throw error;

      setPdfFiles(prev =>
        prev.map(file =>
          file.id === id
            ? { ...file, status, rejectionReason: status === 'reprovado' ? reason : null }
            : file
        )
      );
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status');
    }
  };

  const formatFileSize = (sizeKB) => {
    if (sizeKB < 1024) return `${sizeKB} KB`;
    return `${(sizeKB / 1024).toFixed(2)} MB`;
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

          {userOrigem !== 'agente' && (
            <ImportarArquivos
              agentes={agentes}
              userId={userId}
              onUploadComplete={handleUploadComplete}
            />
          )}

          <FileList
            pdfFiles={pdfFiles}
            onDownload={handleDownload}
            onRemove={handleRemoveFile}
            onDownloadAll={handleDownloadAll}
            onRemoveAll={handleRemoveAllFiles}
            formatFileSize={formatFileSize}
            onStatusChange={handleStatusChange}
            userOrigem={userOrigem}
            userAgenteId={userAgenteId}
          />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;