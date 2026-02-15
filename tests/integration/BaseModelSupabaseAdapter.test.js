// tests/integration/ModelAdapter.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CakeReact } from '../../src/CakeReactCore';
import { BaseModel } from '../../src/Model/BaseModel';
import { SupabaseAdapter } from '../../src/Model/Adapters/SupabaseAdapter';
import { MockSupabaseClient } from '../mocks/MockSupabase';

// Тестовые данные
const MOCK_DATA = {
    products: [
        { id: 1, name: 'Cake', price: 100 },
        { id: 2, name: 'Cookie', price: 50 }
    ]
};

describe('CakeReact Core: Model & Adapter Integration', () => {
    let mockClient;

    beforeEach(() => {
        // 1. Инициализируем фейковый клиент
        mockClient = new MockSupabaseClient(MOCK_DATA);

        // 2. Регистрируем соединение в CakeReact
        // Важно: мы передаем реальный класс SupabaseAdapter, но скармливаем ему фейковый клиент
        CakeReact.addConnection('default', {
            client: mockClient,
            adapter: SupabaseAdapter
        });
    });

    it('find() должен формировать правильный запрос к Supabase', async () => {
        const model = new BaseModel('products');

        // Настраиваем, что должна вернуть база
        mockClient.__setNextResponse([{ id: 1, name: 'Cake', price: 100 }]);

        const results = await model.find({
            conditions: { price: 100 },
            limit: 1
        });

        // Проверяем, что вернулись данные
        expect(results).toHaveLength(1);
        expect(results[0].name).toBe('Cake');

        // Проверяем, какой запрос ушел в "базу"
        expect(mockClient.lastQuery.table).toBe('products');
        expect(mockClient.lastQuery.filters).toContainEqual({
            column: 'price', operator: 'eq', value: 100
        });
    });

    it('save() должен вызывать insert для новых записей', async () => {
        // TODO: Этот тест упадет, пока мы не допишем метод save() и create() в адаптере,
        // но это наша цель на рефакторинг!
    });
});