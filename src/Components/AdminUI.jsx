import React from 'react';
import { CakeSubmit } from './FormHelper';

// --- 1. Обертка всей страницы ---
export const AdminPage = ({ children }) => (
  <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
    <div className="max-w-4xl mx-auto grid grid-cols-1 gap-8">
      {children}
    </div>
  </div>
);

// --- 2. Заголовок страницы ---
export const AdminHeader = ({ title, subtitle, icon = '🎂' }) => (
  <div className="mb-2">
    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center">
      <span className="mr-3">{icon}</span> {title}
    </h1>
    {subtitle && <p className="mt-2 text-sm text-gray-600">{subtitle}</p>}
  </div>
);

// --- 3. Карточка формы (Умная обертка) ---
export const AdminFormSection = ({ controller, title, children, submitLabel = "Запечь в базу" }) => {
  const { record, setRecord } = controller;
  const isEditMode = !!record?.id;

  const handleCancel = () => {
    setRecord({});
  };

  return (
    <section className={`bg-white shadow-sm border border-gray-200 rounded-xl p-6 transition-colors ${isEditMode ? 'border-indigo-300 ring-2 ring-indigo-50' : ''}`}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <span className="mr-2 text-xl">{isEditMode ? '✏️' : '➕'}</span>
          {isEditMode ? `Редактирование: ${title}` : `Создать: ${title}`}
        </h3>
        
        {isEditMode && (
          <button onClick={handleCancel} className="text-sm text-gray-500 hover:text-red-600 transition-colors">
            Отменить
          </button>
        )}
      </div>

      {/* Рендерим саму форму, которая передана как children */}
      {children}

      {/* Кнопки действий */}
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
        {!isEditMode && record && Object.keys(record).length > 0 && (
           <button onClick={handleCancel} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-800">
             Очистить
           </button>
        )}
        <CakeSubmit className={`inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white focus:outline-none transition-colors ${
          isEditMode 
            ? 'bg-amber-600 hover:bg-amber-700' 
            : 'bg-indigo-600 hover:bg-indigo-700'
        }`}>
          {isEditMode ? 'Сохранить изменения' : submitLabel}
        </CakeSubmit>
      </div>
    </section>
  );
};

// --- 4. Умная Таблица (Самое вкусное) ---
export const AdminTableSection = ({ controller, title, columns, onEdit }) => {
  const { data, loading, remove } = controller;

  const handleDelete = (id) => {
    if (window.confirm('Вы уверены, что хотите удалить эту запись?')) {
      remove(id);
    }
  };

  return (
    <section className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
          Всего: {data.length}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className={`px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider ${col.className || ''}`}>
                  {col.label}
                </th>
              ))}
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading && data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-6 py-10 text-center text-gray-500 italic">
                  Загрузка данных...
                </td>
              </tr>
            ) : data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                {columns.map((col, idx) => (
                  <td key={idx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {/* Если передана функция render, используем её, иначе просто выводим поле */}
                    {col.render ? col.render(item) : item[col.key]}
                  </td>
                ))}
                
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => onEdit(item)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                    Изменить
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-700">
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};