// src/Model/BaseEntity.js

export class BaseEntity {
    constructor(properties = {}, options = {}) {
        this._properties = properties;
        this._dirty = {}; // Хранит измененные поля
        this._new = options.new !== false; // Новая запись или из БД?
        this._model = options.source || null; // Ссылка на модель (опционально)

        // Используем Proxy для перехвата обращений entity.prop
        return new Proxy(this, {
            get: (target, prop) => target.get(prop),
            set: (target, prop, value) => {
                target.set(prop, value);
                return true;
            },
            // Чтобы Object.keys(entity) возвращал свойства данных
            ownKeys: (target) => {
                return [...new Set([...Object.keys(target._properties), ...Object.keys(target._dirty)])];
            },
            getOwnPropertyDescriptor: (target, prop) => {
                return { enumerable: true, configurable: true };
            }
        });
    }

    /**
     * Получение значения свойства (аналог магического $this->prop в PHP)
     * Приоритет:
     * 1. Геттер класса (например, _getName)
     * 2. Измененное значение (dirty)
     * 3. Оригинальное значение
     */
    get(field) {
        // Если это метод самого класса (например save, toArray), возвращаем его
        if (typeof this[field] === 'function' && field !== 'get' && field !== 'set') {
            return this[field].bind(this);
        }

        // 1. Ищем кастомный геттер: _getFieldName (CamelCase)
        const getterName = '_get' + this._toPascalCase(field);
        if (typeof this[getterName] === 'function') {
            return this[getterName](this._properties[field]);
        }

        // 2. Возвращаем значение (или undefined)
        return this._properties[field];
    }

    /**
     * Установка значения
     */
    set(field, value) {
        // 1. Ищем кастомный сеттер: _setFieldName
        const setterName = '_set' + this._toPascalCase(field);
        if (typeof this[setterName] === 'function') {
            value = this[setterName](value);
        }

        // 2. Если значение реально изменилось, помечаем как dirty
        if (this._properties[field] !== value) {
            this._dirty[field] = true;
            this._properties[field] = value;
        }

        return this;
    }

    /**
     * Проверка, было ли поле изменено
     */
    isDirty(field) {
        return !!this._dirty[field];
    }

    isNew() {
        return this._new;
    }

    /**
     * Преобразование в чистый JSON
     */
    toArray() {
        const result = { ...this._properties };

        // Тут можно добавить логику для скрытия полей (hidden)
        // или добавления виртуальных (virtual), если они объявлены в дочернем классе
        return result;
    }

    // Для совместимости с JSON.stringify(entity)
    toJSON() {
        return this.toArray();
    }

    // Хелпер: snake_case -> PascalCase (user_id -> UserId)
    _toPascalCase(string) {
        if (!string) return '';
        return string.replace(/(\w)(\w*)/g,
            (g0, g1, g2) => g1.toUpperCase() + g2.toLowerCase()).replace(/_/g, '');
    }
}