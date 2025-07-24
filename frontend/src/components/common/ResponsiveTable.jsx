import React from 'react';
import TouchButton from './TouchButton';

const ResponsiveTable = ({ 
  data = [], 
  columns = [], 
  onEdit, 
  onDelete, 
  emptyMessage = "No hay datos disponibles",
  keyField = "id"
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table View (Large screens only) */}
      <div className="hidden xl:block bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th 
                  key={column.key}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.label}
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item) => (
              <tr key={item[keyField]}>
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {column.render ? column.render(item[column.key], item) : item[column.key]}
                  </td>
                ))}
                {(onEdit || onDelete) && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {onEdit && (
                        <TouchButton
                          variant="ghost"
                          size="small"
                          onClick={() => onEdit(item)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Editar
                        </TouchButton>
                      )}
                      {onDelete && (
                        <TouchButton
                          variant="ghost"
                          size="small"
                          onClick={() => onDelete(item)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Eliminar
                        </TouchButton>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tablet Scrollable Table View */}
      <div className="hidden md:block xl:hidden bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200" style={{ minWidth: '800px' }}>
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column, index) => (
                  <th 
                    key={column.key}
                    className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                      index === 0 ? 'sticky left-0 bg-gray-50 z-10' : ''
                    } ${(onEdit || onDelete) && index === columns.length - 1 ? 'sticky right-0 bg-gray-50 z-10' : ''}`}
                  >
                    {column.label}
                  </th>
                ))}
                {(onEdit || onDelete) && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50 z-10">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((item) => (
                <tr key={item[keyField]}>
                  {columns.map((column, index) => (
                    <td 
                      key={column.key} 
                      className={`px-4 py-4 whitespace-nowrap text-sm text-gray-900 ${
                        index === 0 ? 'sticky left-0 bg-white z-10 font-medium' : ''
                      }`}
                    >
                      {column.render ? column.render(item[column.key], item) : item[column.key]}
                    </td>
                  ))}
                  {(onEdit || onDelete) && (
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium sticky right-0 bg-white z-10">
                      <div className="flex space-x-2">
                        {onEdit && (
                          <TouchButton
                            variant="outline"
                            size="small"
                            onClick={() => onEdit(item)}
                            className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                          >
                            Editar
                          </TouchButton>
                        )}
                        {onDelete && (
                          <TouchButton
                            variant="outline"
                            size="small"
                            onClick={() => onDelete(item)}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            Eliminar
                          </TouchButton>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Scroll indicator for tablets */}
        <div className="bg-gray-50 px-4 py-2 text-xs text-gray-500 text-center border-t">
          ← Desliza horizontalmente para ver más información →
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {data.map((item) => (
          <div key={item[keyField]} className="bg-white shadow rounded-lg p-4">
            <div className="space-y-3">
              {/* Primary field (usually first column) as header */}
              {columns.length > 0 && (
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {columns[0].render ? columns[0].render(item[columns[0].key], item) : item[columns[0].key]}
                    </h3>
                    {columns.length > 1 && (
                      <p className="text-sm text-gray-500">
                        {columns[1].label}: {columns[1].render ? columns[1].render(item[columns[1].key], item) : item[columns[1].key]}
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Other fields */}
              {columns.slice(2).length > 0 && (
                <div className="space-y-2">
                  {columns.slice(2).map((column) => (
                    <div key={column.key} className="flex items-center">
                      <span className="text-sm font-medium text-gray-500 w-24 flex-shrink-0">
                        {column.label}:
                      </span>
                      <span className="text-sm text-gray-900 break-all">
                        {column.render ? column.render(item[column.key], item) : item[column.key]}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Action buttons */}
              {(onEdit || onDelete) && (
                <div className="flex space-x-3 pt-3 border-t border-gray-200">
                  {onEdit && (
                    <TouchButton
                      variant="primary"
                      onClick={() => onEdit(item)}
                      className="flex-1"
                    >
                      Editar
                    </TouchButton>
                  )}
                  {onDelete && (
                    <TouchButton
                      variant="danger"
                      onClick={() => onDelete(item)}
                      className="flex-1"
                    >
                      Eliminar
                    </TouchButton>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default ResponsiveTable;