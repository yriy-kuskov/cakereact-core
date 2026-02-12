export const ValidationRules = {
    notEmpty: (value) => value !== undefined && value !== null && String(value).trim() !== '',
    email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    minLength: (value, min) => String(value).length >= min,
    maxLength: (value, max) => String(value).length <= max,
    numeric: (value) => !isNaN(parseFloat(value)) && isFinite(value),
    // Твой специфичный валидатор штрихкодов (EAN-13 для примера)
    barcode: (value) => /^\d{8,14}$/.test(value),
    custom: (value, fn) => fn(value),
};