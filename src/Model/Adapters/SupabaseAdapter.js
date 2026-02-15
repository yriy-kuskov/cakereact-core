// src/Model/Adapters/SupabaseAdapter.js
import { BaseAdapter } from './BaseAdapter';

export class SupabaseAdapter extends BaseAdapter {
    /**
     * Поиск по ID - прямой и быстрый
     */
    async findById(table, id, primaryKey = 'id', options = {}) {
        const selectFields = this._buildSelectQuery(options.contain);

        const { data, error } = await this.client
            .from(table)
            .select(selectFields)
            .eq(primaryKey, id)
            .single(); // Возвращает объект, а не массив

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 - не найдено
        return data;
    }

    async find(table, options = {}) {
        const selectFields = this._buildSelectQuery(options.contain);
        let query = this.client.from(table).select(selectFields);

        // Условия
        if (options.conditions) {
            Object.entries(options.conditions).forEach(([column, value]) => {
                if (value === null) query = query.is(column, null);
                else if (Array.isArray(value)) query = query.in(column, value);
                else query = query.eq(column, value);
            });
        }

        // Сортировка
        if (options.order) {
            query = query.order(options.order[0], { ascending: options.order[1]?.toLowerCase() === 'asc' });
        }

        // Лимит
        if (options.limit) query = query.limit(options.limit);

        const { data, error } = await query;
        if (error) throw error;
        return data;
    }

    /**
     * Формирует строку выборки полей, включая связи (contain)
     * @param {Array|Object|null} contain 
     * @returns {string}
     */
    _buildSelectQuery(contain) {
        if (!contain || (Array.isArray(contain) && contain.length === 0)) {
            return '*';
        }

        // Если передали массив ['User', 'Comments']
        if (Array.isArray(contain)) {
            const related = contain.map(relation => `${relation}(*)`).join(', ');
            return `*, ${related}`;
        }

        // Если передали сложный объект для глубокой вложенности: { User: ['Profile'], Comments: true }
        if (typeof contain === 'object') {
            const related = Object.entries(contain).map(([key, value]) => {
                const subFields = (typeof value === 'object') ? this._buildSelectQuery(value) : '*';
                return `${key}(${subFields})`;
            }).join(', ');
            return `*, ${related}`;
        }

        return '*';
    }

    async create(table, data) {
        const { data: result, error } = await this.client
            .from(table)
            .insert(data)
            .select()
            .single();
        if (error) throw error;
        return result;
    }

    async update(table, data, primaryKey) {
        const { data: result, error } = await this.client
            .from(table)
            .update(data)
            .eq(primaryKey, data[primaryKey])
            .select()
            .single();
        if (error) throw error;
        return result;
    }

    async delete(table, id, primaryKey) {
        const { error } = await this.client
            .from(table)
            .delete()
            .eq(primaryKey, id);
        if (error) throw error;
        return true;
    }
}