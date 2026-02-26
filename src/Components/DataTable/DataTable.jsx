// components/DataTable/DataTable.jsx
import React from 'react';
import './DataTable.css';

function DataTable({ data, columns, actions }) {
  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
            {actions && <th>Ações</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={item.id || index}>
              {columns.map((col) => (
                <td key={col.key}>
                  {col.render ? col.render(item) : item[col.key]}
                </td>
              ))}
              {actions && (
                <td className="actions">
                  {actions.map((action, i) => (
                    <button
                      key={i}
                      className={action.className}
                      onClick={() => action.handler(item)}
                      title={action.label}
                    >
                      {action.icon}
                    </button>
                  ))}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;