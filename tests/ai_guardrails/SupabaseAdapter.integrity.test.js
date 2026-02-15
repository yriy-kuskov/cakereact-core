import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SupabaseAdapter } from '../../src/Model/Adapters/SupabaseAdapter';

// Мок для клиента Supabase
const mockSupabase = {
    from: vi.fn(() => queryBuilder),
};

const queryBuilder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: {}, error: null }), // Важно для findById
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    then: (cb) => Promise.resolve({ data: [], error: null }).then(cb)
};

describe('AI Guardrail: SupabaseAdapter Integrity', () => {
    let adapter;

    beforeEach(() => {
        vi.clearAllMocks();
        adapter = new SupabaseAdapter(mockSupabase);
    });

    it('🔒 должен содержать ВСЕ методы (Interface + Helpers)', () => {
        const requiredMethods = [
            'find',
            'findById',
            'create',
            'update',
            'delete',
            '_buildSelectQuery' // Я не имею права удалять этот хелпер!
        ];

        requiredMethods.forEach(method => {
            expect(typeof adapter[method]).toBe('function', `Метод ${method} отсутствует в SupabaseAdapter!`);
        });
    });

    it('🔒 find() обязан использовать _buildSelectQuery для построения запроса', async () => {
        const spyBuild = vi.spyOn(adapter, '_buildSelectQuery');

        await adapter.find('users', { contain: ['Profile'] });

        expect(spyBuild).toHaveBeenCalled();
        expect(queryBuilder.select).toHaveBeenCalled();
    });

    it('🔒 findById() обязан вызывать .single() для производительности', async () => {
        await adapter.findById('users', 1);
        expect(queryBuilder.single).toHaveBeenCalled();
    });
});