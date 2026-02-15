// tests/unit/BaseEntity.test.js
import { describe, it, expect } from 'vitest';
import { BaseEntity } from '../../src/Model/BaseEntity';

// 1. Создаем тестовый класс, наследуемый от BaseEntity
class User extends BaseEntity {
    // Магический геттер
    _getFullName() {
        return `${this._properties.first_name} ${this._properties.last_name}`;
    }

    // Магический сеттер
    _setEmail(value) {
        return value.toLowerCase().trim();
    }
}

describe('CakeReact Core: BaseEntity', () => {

    it('должен инициализироваться с данными', () => {
        const user = new User({ id: 1, first_name: 'John' });
        expect(user.id).toBe(1);
        expect(user.first_name).toBe('John');
    });

    it('должен использовать магические геттеры (Virtual Fields)', () => {
        const user = new User({ first_name: 'John', last_name: 'Doe' });
        expect(user.full_name).toBe('John Doe'); // Проверка snake_case доступа к _getCamelCase
    });

    it('должен отслеживать грязные поля (Dirty Checking)', () => {
        const user = new User({ id: 1, name: 'Old Name' }, { new: false });

        // Сначала чисто
        expect(user.isDirty('name')).toBe(false);

        // Меняем
        user.name = 'New Name';

        // Проверяем значение через геттер
        expect(user.name).toBe('New Name');

        // Проверяем флаг (он должен вернуть true)
        expect(user.isDirty('name')).toBe(true);

        // Проверяем внутреннее хранилище (оно должно хранить САМО ЗНАЧЕНИЕ)
        expect(user._dirty['name']).toBe('New Name');
    });

    it('должен использовать магические сеттеры', () => {
        const user = new User({});
        user.email = '  TEST@Example.com  ';

        expect(user.email).toBe('test@example.com');
        expect(user.isDirty('email')).toBe(true);
    });

    it('toArray() должен возвращать чистый объект', () => {
        const user = new User({ id: 1 });
        user.name = 'Test';

        const raw = user.toArray();
        expect(raw).toEqual({ id: 1, name: 'Test' });
        expect(raw).not.toBeInstanceOf(BaseEntity);
    });
});