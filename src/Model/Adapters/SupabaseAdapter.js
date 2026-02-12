import { BaseAdapter } from './BaseAdapter';

export class SupabaseAdapter extends BaseAdapter {
    async find(table, options = {}, relations = {}) {
        // Переносим сюда логику построения запроса с JOIN-ами
        let selectStr = options.select || this._buildSelectQuery(relations);

        let query = this.client.from(table).select(selectStr);

        if (options.order) query = query.order(options.order[0], { ascending: options.order[1] === 'asc' });
        if (options.limit) query = query.limit(options.limit);

        const { data, error } = await query;
        if (error) throw error;
        return data;
    }

    /**
     * Поиск одной записи по ID с учетом связей
     * Логика перенесена из BaseModel.findById
     */
    async findById(table, id, primaryKey, relations = {}) {
        const selectStr = this._buildSelectQuery(relations);
        const { data, error } = await this.client
            .from(table)
            .select(selectStr)
            .eq(primaryKey, id)
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Создание новой записи
     * Логика перенесена из BaseModel.save
     */
    async create(table, data) {
        const result = await this.client.from(table).insert([data]).select()/*.single()*/;
        if (result.error) throw result.error;
        return result;
    }

    /**
     * Обновление существующей записи
     * Логика перенесена из BaseModel.save
     */
    async update(table, data, primaryKey) {
        console.log(`[🎂 CakeReact]: primaryKey: ${primaryKey}`);
        console.log(`[🎂 CakeReact]: data[primaryKey]: ${data[primaryKey]}`);
        const result = await this.client
            .from(table)
            .update(data)
            .eq(primaryKey, data[primaryKey])
            .select()
            /*.single()*/;

        if (result.error) throw result.error;
        console.log(`[🎂 CakeReact]: ${result}`);
        return result;
    }

    /**
     * Удаление записи
     * Логика перенесена из BaseModel.delete
     */
    async delete(table, id, primaryKey) {
        const { error } = await this.client
            .from(table)
            .delete()
            .eq(primaryKey, id);

        if (error) throw error;
        return true;
    }

    /**
     * Вспомогательный метод для построения строк типа "table(*), other_table(*)"
     * Используется для автоматической подгрузки связанных данных
     */
    _buildSelectQuery(relations) {
        let query = '*';
        if (relations.belongsTo) {
            Object.values(relations.belongsTo).forEach(r => query += `, ${r.table}(*)`);
        }
        if (relations.hasMany) {
            Object.values(relations.hasMany).forEach(r => query += `, ${r.table}(*)`);
        }
        return query;
    }

    // ... методы update, delete, findById
}