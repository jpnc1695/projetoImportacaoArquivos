// pages/Admin/Admin.jsx
import { useEffect, useState } from 'react';
import DataTable from '../../Components/DataTable/DataTable';
import './Admin.css';

function Admin() {
  const [activeTab, setActiveTab] = useState('users'); // 'users' ou 'agents'
  const [users, setUsers] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState({ users: false, agents: false });
  const [error, setError] = useState({ users: '', agents: '' });

  // Definição das colunas para usuários
  const userColumns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Nome' },
    { key: 'email', label: 'Email' },
    { key: 'username', label: 'Usuário' },
    {
      key: 'origem',
      label: 'Origem',
      render: (user) => (user.origem === 'importacao' ? 'Importação' : 'Marketing'),
    },
    {
      key: 'createdAt',
      label: 'Data de Criação',
      render: (user) => new Date(user.createdAt).toLocaleDateString('pt-BR'),
    },
  ];

  // Definição das colunas para agentes (ajuste conforme seus dados)
  const agentColumns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Nome' },
    { key: 'username', label: 'Usuário' },
    {key: 'email', label: 'Email'},
    {
      key: 'createdAt',
      label: 'Criado em',
      render: (agent) => new Date(agent.createdAt).toLocaleDateString('pt-BR'),
    },
  ];

  // Ações comuns
  const actions = (type) => [
    {
      label: 'Editar',
      icon: '✏️',
      className: 'edit-btn',
      handler: (item) => handleEdit(type, item),
    },
    {
      label: 'Excluir',
      icon: '🗑️',
      className: 'delete-btn',
      handler: (item) => handleDelete(type, item.id),
    },
  ];

  // Buscar dados
  useEffect(() => {
    fetchUsers();
    fetchAgents();
  }, []);

  const fetchUsers = async () => {
    setLoading((prev) => ({ ...prev, users: true }));
    try {
      const res = await fetch('http://localhost:3001/api/users');
      if (!res.ok) throw new Error('Erro ao carregar usuários');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError((prev) => ({ ...prev, users: err.message }));
    } finally {
      setLoading((prev) => ({ ...prev, users: false }));
    }
  };

  const fetchAgents = async () => {
    setLoading((prev) => ({ ...prev, agents: true }));
    try {
      const res = await fetch('http://localhost:3001/api/agentes'); // ajuste a URL
      if (!res.ok) throw new Error('Erro ao carregar agentes');
      const data = await res.json();
      setAgents(data);
    } catch (err) {
      setError((prev) => ({ ...prev, agents: err.message }));
    } finally {
      setLoading((prev) => ({ ...prev, agents: false }));
    }
  };

  const handleEdit = (type, item) => {
    console.log(`Editar ${type}:`, item);
    // Abrir modal ou redirecionar para formulário de edição
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm(`Tem certeza que deseja excluir este ${type === 'users' ? 'usuário' : 'agente'}?`))
      return;

    try {
      const endpoint = type === 'users' ? `users/${id}` : `agentes/${id}`;
      const res = await fetch(`http://localhost:3001/api/${endpoint}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Erro ao excluir');

      // Atualizar lista
      if (type === 'users') {
        setUsers(users.filter((u) => u.id !== id));
      } else {
        setAgents(agents.filter((a) => a.id !== id));
      }
      alert('Excluído com sucesso!');
    } catch (err) {
      alert('Erro: ' + err.message);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-container">
        {/* Abas */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Usuários
          </button>
          <button
            className={`tab ${activeTab === 'agents' ? 'active' : ''}`}
            onClick={() => setActiveTab('agents')}
          >
            Agentes
          </button>
        </div>

        {/* Conteúdo da aba */}
        <div className="tab-content">
          {activeTab === 'users' && (
            <>
              {loading.users && <div className="loading">Carregando usuários...</div>}
              {error.users && <div className="error">{error.users}</div>}
              {!loading.users && !error.users && (
                <DataTable
                  data={users}
                  columns={userColumns}
                  actions={actions('users')}
                />
              )}
            </>
          )}

          {activeTab === 'agents' && (
            <>
              {loading.agents && <div className="loading">Carregando agentes...</div>}
              {error.agents && <div className="error">{error.agents}</div>}
              {!loading.agents && !error.agents && (
                <DataTable
                  data={agents}
                  columns={agentColumns}
                  actions={actions('agents')}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Admin;