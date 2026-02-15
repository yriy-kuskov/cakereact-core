import { describe, it, expect, vi } from 'vitest';
import { BaseEntity } from '../../src/Model/BaseEntity';

describe('AI Guardrail: BaseEntity Integrity', () => {

    it('🔒 должен содержать основные методы управления состоянием', () => {
        const entity = new BaseEntity();
        const requiredMethods = [
            'get', 'set', 'isDirty', 'clean', 'isNew', 'toArray'
        ];

        requiredMethods.forEach(method => {
            expect(typeof entity[method]).toBe('function', `Метод ${method} был удален из BaseEntity!`);
        });
    });

    it('🔒 сеттеры должны работать через Proxy и помечать поле как dirty', () => {
        const entity = new BaseEntity({ name: 'Old' });

        // Прямое присваивание должно триггерить set()
        entity.name = 'New';

        expect(entity.get('name')).toBe('New');
        expect(entity.isDirty('name')).toBe(true);
    });

    it('🔒 clean() должен сбрасывать состояние dirty', () => {
        const entity = new BaseEntity({ name: 'Old' });
        entity.name = 'New';

        expect(entity.isDirty('name')).toBe(true);

        entity.clean();

        expect(entity.isDirty('name')).toBe(false);
        expect(entity.get('name')).toBe('New'); // Значение сохраняется, но флага dirty нет
    });

    it('🔒 должен сохранять ссылку на модель (source)', () => {
        const mockModel = { table: 'test' };
        const entity = new BaseEntity({}, { source: mockModel });

        // Это приватное свойство, но оно критично для lazy loading в будущем
        expect(entity._model).toBe(mockModel);
    });
});