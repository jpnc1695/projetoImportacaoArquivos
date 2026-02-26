import React from 'react';
import './UserTable.css';

function UserTable({ data, onEdit, onDelete, type }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const getColumns = () => {
    if (type === 'user') {
      return [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Nome' },
        { key: 'email', label: 'Email' },
        { key: 'username', label: 'Usuário' },
        { 
          key: 'origem', 
          label: 'Origem',
          render: (item) => item.origem === 'importacao' ? 'Importação' : 'Marketing'
        },
        { 
          key: 'createdAt', 
          label: 'Data de Criação',
          render: (item) => formatDate(item.createdAt)
        }
      ];
    } else {
      // Agentes - ajuste conforme os campos do seu JSON
      return [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Nome' },
        { key: 'username', label: 'Usuário' },
        // Se houver outros campos como 'setor', 'telefone', etc.
        { 
          key: 'createdAt', 
          label: 'Data de Criação',
          render: (item) => formatDate(item.createdAt)
        }
      ];
    }
  };

  const columns = getColumns();

  return (
    <div className="user-table-container">
      <table className="user-table">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key}>{col.label}</th>
            ))}
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.id}>
              {columns.map(col => (
                <td key={col.key}>
                  {col.render ? col.render(item) : item[col.key]}
                </td>
              ))}
              <td className="actions">
                <button
                  className="edit-btn"
                  onClick={() => onEdit(item)}
                  title="Editar"
                >
                  ✏️
                </button>
                <button
                  className="delete-btn"
                  onClick={() => onDelete(item.id)}
                  title="Excluir"
                >
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default UserTable;