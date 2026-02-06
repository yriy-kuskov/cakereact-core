import React, { createContext, useContext } from 'react';

const CakeContext = createContext(null);

// 1. Обертка формы (CakeForm)
export const CakeForm = ({ controller, children, className }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    controller.save(controller.record || {});
  };

  return (
    <CakeContext.Provider value={controller}>
      <form onSubmit={handleSubmit} className={className}>
        {controller.error && (
          <div style={{ color: 'red', marginBottom: '10px' }}>
            Ошибка: {controller.error}
          </div>
        )}
        {children}
      </form>
    </CakeContext.Provider>
  );
};

// 2. Умное поле ввода (CakeInput)
export const CakeInput = ({ field, label, type = "text", ...props }) => {
  const controller = useContext(CakeContext);
  
  if (!controller) {
    throw new Error('CakeInput должен использоваться внутри CakeForm');
  }

  const value = controller.record?.[field] || '';

  const handleChange = (e) => {
    const val = type === 'number' ? parseFloat(e.target.value) : e.target.value;
    controller.setRecord({
      ...controller.record,
      [field]: val
    });
  };

  return (
    <div className="cake-input-group" style={{ marginBottom: '15px' }}>
      {label && <label style={{ display: 'block', fontWeight: 'bold' }}>{label}</label>}
      <input
        type={type}
        value={value}
        onChange={handleChange}
        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        {...props}
      />
    </div>
  );
};

// 3. Кнопка отправки (CakeSubmit)
export const CakeSubmit = ({ children, ...props }) => {
  const { loading } = useContext(CakeContext);
  return (
    <button type="submit" disabled={loading} {...props}>
      {loading ? 'Запекаем...' : children}
    </button>
  );
};