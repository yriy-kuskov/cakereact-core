import { BaseAdapter } from './BaseAdapter';

export class SupabaseAdapter extends BaseAdapter {
    async find(table, options = {}, relations = {}) {
        // Переносим сюда логику построения запроса с JOIN-ами
        let selectStr = options.select || this._buildSelectQuery(relations);

        let query = this.client.from(table).select(selectStr);

        // Если есть полиморфные связи, накладываем фильтр на вложенную таблицу
        if (relations.belongsToMany) {
            Object.entries(relations.belongsToMany).forEach(([alias, r]) => {
                if (r.polymorphic) {
                    // Фильтруем вложенную таблицу pivot, чтобы взять файлы только для текущей модели
                    // Синтаксис Supabase: 'model_files.model_name'
                    query = query.eq(`${r.through}.model_name`, table);
                }
            });
        }

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
     * Используется для автоматической подгрузки связанных данных.
     */
    //TODO: В модели можно будет указывать правила сортировки в конфигах: belongsTo, hasMany, belongsToMany, и адаптер будет их считывать. Но пока вариант А — самый простой и рабочий для текущей архитектуры.
    _buildSelectQuery(relations) {
        let query = '*';

        // 1. BelongsTo (Родители: category, store)
        // Пример: category(*)
        if (relations.belongsTo) {
            Object.values(relations.belongsTo).forEach(r => {
                query += `, ${r.table}(*)`;
            });
        }

        // 2. HasMany (Дочерние: variants, reviews)
        // Пример: variants(*)
        if (relations.hasMany) {
            Object.values(relations.hasMany).forEach(r => {
                query += `, ${r.table}(*)`;
            });
        }

        if (relations.belongsToMany) {
            Object.values(relations.belongsToMany).forEach(r => {
                // Если связь полиморфная, нам нужно добавить фильтр внутри select.
                // В Supabase это делается через синтаксис: 
                // table_name!inner(fields) или просто фильтрацией вложенного ресурса.

                if (r.polymorphic) {
                    // Запрашиваем связь через общую таблицу model_files
                    // ВАЖНО: фильтрация по model_name будет происходить в find()
                    query += `, ${r.through}(*, ${r.table}(*))`;
                } else {
                    // Обычная связь через pivot-таблицу (как делали раньше)
                    query += `, ${r.through}(*, ${r.table}(*))`;
                }
            });
        }

        return query;
    }
}