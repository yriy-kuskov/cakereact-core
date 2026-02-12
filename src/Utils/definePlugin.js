/**
 * Хелпер для создания плагинов с подсказками.
 * @param {object} config - Конфигурация плагина { name, setup, ... }
 */
export const definePlugin = (config) => {
    if (!config.name) {
        console.warn('[🎂 CakeReact]: Plugin must have a "name" property.');
    }
    return config;
};