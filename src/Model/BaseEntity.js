// src/Model/BaseEntity.js

export class BaseEntity {
    constructor(properties = {}, options = {}) {
        this._properties = properties;
        this._dirty = {}; // Хранит измененные поля
        this._new = options.new !== false; // Новая запись или из БД?
        this._model = options.source || null; // Ссылка на модель (опционально)

        // Используем Proxy для перехвата обращений entity.prop
        return new Proxy(this, {
            get: (target, prop, receiver) => {
                // 1. Если обращение к служебным полям (начинаются с _) или методам класса — возвращаем напрямую
                if (typeof prop === 'string' && (prop.startsWith('_') || typeof target[prop] === 'function')) {
                    return Reflect.get(target, prop, receiver);
                }

                // 2. Иначе идем через нашу логику геттеров
                return target.get(prop);
            },

            set: (target, prop, value, receiver) => {
                // 1. Если это служебное поле — пишем напрямую
                if (typeof prop === 'string' && prop.startsWith('_')) {
                    return Reflect.set(target, prop, value, receiver);
                }

                // 2. Иначе через нашу логику сеттеров
                target.set(prop, value);
                return true;
            },

            // Чтобы Object.keys(entity) возвращал свойства данных, а не методы класса
            ownKeys: (target) => {
                // Собираем ключи из свойств и dirty
                return [...new Set([...Object.keys(target._properties), ...Object.keys(target._dirty)])];
            },

            getOwnPropertyDescriptor: (target, prop) => {
                return {
                    enumerable: true,
                    configurable: true,
                    value: target.get(prop) // Важно! Чтобы JSON.stringify брал значение через геттер
                };
            }
        });
    }

    /**
     * Получение значения свойства
     */
    get(field) {
        // 1. Ищем кастомный геттер: _getFieldName (CamelCase)
        // full_name -> _getFullName
        const pascalCase = this._toPascalCase(field);
        const getterName = `_get${pascalCase}`;

        if (typeof this[getterName] === 'function') {
            // Передаем сырое значение (если есть) в геттер
            return this[getterName](this._properties[field]);
        }

        // 2. Если поле есть в _dirty, возвращаем его
        if (field in this._dirty) {
            return this._dirty[field];
        }

        // 3. Возвращаем оригинальное значение
        return this._properties[field];
    }

    /**
     * Установка значения
     */
    set(field, value) {
        // 1. Ищем кастомный сеттер: _setFieldName
        const pascalCase = this._toPascalCase(field);
        const setterName = `_set${pascalCase}`;

        if (typeof this[setterName] === 'function') {
            value = this[setterName](value);
        }

        // 2. Сравниваем с текущим значением (чтобы не помечать dirty зря)
        // Текущее значение берем из _dirty или _properties
        const currentValue = (field in this._dirty) ? this._dirty[field] : this._properties[field];

        if (currentValue !== value) {
            this._dirty[field] = value;
        }

        return this;
    }

    /**
     * Проверка, было ли поле изменено
     */
    isDirty(field) {
        if (field) {
            return Object.prototype.hasOwnProperty.call(this._dirty, field);
        }
        return Object.keys(this._dirty).length > 0;
    }

    isNew() {
        return this._new;
    }

    /**
     * Сброс состояния dirty (например, после сохранения)
     */
    clean() {
        // Переносим dirty в properties
        Object.assign(this._properties, this._dirty);
        this._dirty = {};
        this._new = false;
        return this;
    }

    /**
     * Преобразование в чистый JSON
     */
    toArray() {
        const result = { ...this._properties };

        // Накладываем dirty поверх
        Object.assign(result, this._dirty);

        // TODO: Здесь можно добавить логику для virtual fields, если мы хотим их в JSON
        // Но пока оставим только реальные данные
        return result;
    }

    // Для совместимости с JSON.stringify(entity)
    toJSON() {
        return this.toArray();
    }

    // Хелпер: snake_case -> PascalCase (user_id -> UserId, full_name -> FullName)
    _toPascalCase(string) {
        if (!string) return '';
        return string
            .replace(/^_+/, '') // Убираем подчеркивания в начале, если есть
            .replace(/_(\w)/g, (match, letter) => letter.toUpperCase()) // snake_case -> camelCase
            .replace(/^\w/, c => c.toUpperCase()); // camelCase -> PascalCase
    }
}