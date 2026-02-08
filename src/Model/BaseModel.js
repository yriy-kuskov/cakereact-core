import { CakeReact } from '../index';

export default class BaseModel {
  constructor(table, config = {}) {
    this.table = table;
    this.primaryKey = config.primaryKey || 'id';
    this.displayField = config.displayField || 'name';
    
    // Инициализация связей в стиле CakePHP
    this.belongsTo = config.belongsTo || {};
    this.hasMany = config.hasMany || {};
  }

  /**
   * Геттер для доступа к Supabase через централизованный сервис CakeReact.
   * Это позволяет модели не зависеть от путей импорта в конкретном проекте.
   */
  get db() {
    return CakeReact.getService();
  }

  /**
   * Генерирует строку запроса для Supabase на основе связей (JOIN-ы)
   * Аналог автоматического fetch-а в CakePHP
   */
  _buildSelectQuery() {
    let query = '*';
    
    // Добавляем связи belongsTo: 'stores(*)'
    Object.keys(this.belongsTo).forEach(alias => {
      const relation = this.belongsTo[alias];
      query += `, ${relation.table}(*)`;
    });

    // Добавляем связи hasMany: 'deals(*)'
    Object.keys(this.hasMany).forEach(alias => {
      const relation = this.hasMany[alias];
      query += `, ${relation.table}(*)`;
    });

    return query;
  }

  // Найти все записи с учетом связей
  async find(options = {}) {
    let query = this.db // Используем динамический клиент
      .from(this.table)
      .select(this._buildSelectQuery());

    if (options.where) {
      Object.keys(options.where).forEach(key => {
        query = query.eq(key, options.where[key]);
      });
    }

    if (options.limit) query = query.limit(options.limit);
    if (options.order) {
      const [column, direction] = options.order;
      query = query.order(column, { ascending: direction === 'asc' });
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  // Найти одну запись по ID
  async findById(id) {
    const { data, error } = await this.db // Используем динамический клиент
      .from(this.table)
      .select(this._buildSelectQuery())
      .eq(this.primaryKey, id)
      .single();

    if (error) throw error;
    return data;
  }

  // Сохранить (Create или Update) - в стиле CakePHP save()
  async save(data) {
    const isUpdate = !!data[this.primaryKey];
    let result;

    if (isUpdate) {
      result = await this.db // Используем динамический клиент
        .from(this.table)
        .update(data)
        .eq(this.primaryKey, data[this.primaryKey])
        .select();
    } else {
      result = await this.db // Используем динамический клиент
        .from(this.table)
        .insert([data])
        .select();
    }

    if (result.error) throw result.error;
    return result.data[0];
  }

  // Удалить
  async delete(id) {
    const { error } = await this.db // Используем динамический клиент
      .from(this.table)
      .delete()
      .eq(this.primaryKey, id);

    if (error) throw error;
    return true;
  }
}