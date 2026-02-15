import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseModel } from '../../src/Model/BaseModel';
import { CakeReact } from '../../src/CakeReactCore';

// Мок для адаптера, чтобы тесты не падали из-за отсутствия БД
const mockAdapter = {
    find: vi.fn(() => Promise.resolve([])),
    findById: vi.fn(() => Promise.resolve(null)),
};

describe('AI Guardrail: BaseModel Integrity', () => {
    let model;

    beforeEach(() => {
        model = new BaseModel('posts');
        // Подменяем адаптер
        vi.spyOn(CakeReact, 'getAdapter').mockReturnValue(mockAdapter);
    });

    it('должен содержать ВСЕ обязательные методы (защита от удаления)', () => {
        const requiredMethods = [
            'find', 'findById', 'save', 'delete',
            '_normalizeResults', '_normalizeRow', '_getRelations',
            'validationDefault', 'createEntity'
        ];

        requiredMethods.forEach(method => {
            expect(typeof model[method]).toBe('function', `Метод ${method} был удален!`);
        });
    });

    it('find() должен обязательно вызывать _normalizeRow для каждой записи', async () => {
        // Подкладываем данные
        mockAdapter.find.mockResolvedValueOnce([{ id: 1 }, { id: 2 }]);

        // Шпионим за внутренним методом
        const normalizeSpy = vi.spyOn(model, '_normalizeRow');

        await model.find('all');

        expect(normalizeSpy).toHaveBeenCalledTimes(2);
        expect(normalizeSpy).toHaveBeenCalledWith({ id: 1 });
    });

    it('save() должен вызывать события beforeSave и afterSave', async () => {
        const emitSpy = vi.spyOn(CakeReact, 'emit');
        const entity = model.createEntity({ title: 'Test' });

        await model.save(entity);

        // Проверяем, что события были вызваны
        expect(emitSpy).toHaveBeenCalledWith('Model.beforeSave', expect.any(Object));
        expect(emitSpy).toHaveBeenCalledWith('Model.afterSave', expect.any(Object));
    });
});