import React, { createContext, useContext, useState, useEffect } from 'react';

const CakeContext = createContext(null);

export const CakeForm = ({ controller, children, className }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    controller.save(controller.record || {});
  };

  return (
    <CakeContext.Provider value={controller}>
      <form onSubmit={handleSubmit} className={className}>
        {controller.error && (
          <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
            Ошибка: {controller.error}
          </div>
        )}
        {children}
      </form>
    </CakeContext.Provider>
  );
};

export const CakeInput = ({ field, label, type = "text", helpText, ...props }) => {
  const controller = useContext(CakeContext);
  if (!controller) throw new Error('CakeInput must be inside CakeForm');

  const value = controller.record?.[field] || (type === 'checkbox' ? false : '');

  const handleChange = (e) => {
    let val;
    if (type === 'checkbox') val = e.target.checked;
    else if (type === 'file') val = e.target.files[0]; 
    else if (type === 'number') val = parseFloat(e.target.value);
    else val = e.target.value;

    controller.setRecord({ ...controller.record, [field]: val });
  };

  // Вспомогательная логика для файлов
  const isUrl = typeof value === 'string' && value.startsWith('http');
  const isImage = isUrl && /\.(jpg|jpeg|png|webp|avif|gif|svg)$/i.test(value);

  const inputClasses = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all sm:text-sm";

  return (
    <div className="mb-6">
      {label && <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>}
      
      {/* Блок предпросмотра существующего файла */}
      {type === 'file' && isUrl && (
        <div className="mb-3 p-3 border border-dashed border-gray-200 rounded-lg bg-gray-50 flex items-center gap-4">
          {isImage ? (
            <img src={value} alt="Current" className="w-16 h-16 object-cover rounded shadow-sm border border-white" />
          ) : (
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 flex items-center justify-center rounded text-2xl">📄</div>
          )}
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Текущий файл:</p>
            <a href={value} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 hover:underline truncate block">
              Открыть в новой вкладке
            </a>
          </div>
        </div>
      )}

      {/* Основной инпут */}
      {type === 'textarea' ? (
        <textarea
          value={value}
          onChange={handleChange}
          className={`${inputClasses} min-h-[100px]`}
          {...props}
        />
      ) : type === 'checkbox' ? (
        <label className="flex items-center gap-3 cursor-pointer group">
          <input type="checkbox" checked={!!value} onChange={handleChange} className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" {...props} />
          {props.placeholder && <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{props.placeholder}</span>}
        </label>
      ) : (
        <div className="relative">
          <input
            type={type}
            value={type === 'file' ? undefined : value}
            onChange={handleChange}
            className={`${type === 'file' ? 'text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100' : inputClasses}`}
            {...props}
          />
          {type === 'file' && isUrl && (
            <div className="mt-2 text-xs text-amber-600 flex items-center gap-1">
              <span>💡</span> Выберите новый файл, чтобы заменить текущий
            </div>
          )}
        </div>
      )}

      {helpText && <p className="mt-2 text-xs text-gray-400 italic">{helpText}</p>}
    </div>
  );
};

// Внутри FormHelper.jsx

export const CakeSelect = ({ field, label, model, options = [], displayField = 'name', placeholder = "Выберите..." }) => {
  const controller = useContext(CakeContext); //
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dynamicOptions, setDynamicOptions] = useState([]);

  // Автоматическая загрузка данных из модели
  useEffect(() => {
    if (model) {
      const instance = new model();
      instance.find().then(setDynamicOptions);
    }
  }, [model]);

  const items = model ? dynamicOptions : options;
  const selectedId = controller.record?.[field] || ''; //
  const selectedItem = items.find(i => (i.id || i.value) == selectedId);

  const filteredItems = items.filter(item => 
    (item[displayField] || item.label || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mb-6 relative">
      {label && <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>}
      
      {/* Кнопка открытия / Выбранное значение */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white cursor-pointer flex justify-between items-center hover:border-indigo-400 transition-colors"
      >
        <span className={selectedItem ? "text-gray-900" : "text-gray-400"}>
          {selectedItem ? (selectedItem[displayField] || selectedItem.label) : placeholder}
        </span>
        <span className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
          {/* Поле поиска */}
          <div className="p-2 border-b bg-gray-50">
            <input 
              autoFocus
              className="w-full px-3 py-1.5 text-sm border rounded outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Поиск..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {/* Список вариантов */}
          <div className="max-h-60 overflow-y-auto">
            {filteredItems.length > 0 ? filteredItems.map(item => (
              <div 
                key={item.id || item.value}
                onClick={() => {
                  controller.setRecord({ ...controller.record, [field]: item.id || item.value }); //
                  setIsOpen(false);
                  setSearchTerm('');
                }}
                className={`px-4 py-2 text-sm cursor-pointer hover:bg-indigo-50 ${selectedId == (item.id || item.value) ? 'bg-indigo-100 font-bold text-indigo-700' : ''}`}
              >
                {item[displayField] || item.label}
              </div>
            )) : (
              <div className="px-4 py-3 text-sm text-gray-400 text-center italic">Ничего не найдено</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const CakeMultiSelect = ({ field, label, model, options = [], displayField = 'name' }) => {
  const controller = useContext(CakeContext); //
  const [dynamicOptions, setDynamicOptions] = useState([]);
  
  useEffect(() => {
    if (model) {
      const instance = new model();
      instance.find().then(setDynamicOptions);
    }
  }, [model]);

  const items = model ? dynamicOptions : options;
  // Инициализируем массив, если он пустой
  const selectedIds = Array.isArray(controller.record?.[field]) ? controller.record[field] : [];

  const toggleItem = (id) => {
    const newIds = selectedIds.includes(id) 
      ? selectedIds.filter(i => i !== id)
      : [...selectedIds, id];
    
    controller.setRecord({ ...controller.record, [field]: newIds }); //
  };

  return (
    <div className="mb-6">
      {label && <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>}
      
      {/* Сетка чекбоксов в виде тегов */}
      <div className="flex flex-wrap gap-2 p-3 border border-gray-200 rounded-xl bg-gray-50/50">
        {items.map(item => {
          const id = item.id || item.value;
          const isSelected = selectedIds.includes(id);
          
          return (
            <button
              key={id}
              type="button"
              onClick={() => toggleItem(id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border flex items-center gap-2 ${
                isSelected 
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' 
                  : 'bg-white border-gray-300 text-gray-600 hover:border-indigo-300'
              }`}
            >
              {isSelected && <span>✓</span>}
              {item[displayField] || item.label}
            </button>
          );
        })}
        {items.length === 0 && <span className="text-sm text-gray-400 italic">Список пуст...</span>}
      </div>
      <p className="mt-2 text-[10px] text-gray-400 uppercase tracking-widest">
        Выбрано элементов: {selectedIds.length}
      </p>
    </div>
  );
};

export const CakeSubmit = ({ children, className, ...props }) => {
  const { loading } = useContext(CakeContext);
  return (
    <button type="submit" disabled={loading} className={className} {...props}>
      {loading ? 'Запекаем...' : children}
    </button>
  );
};