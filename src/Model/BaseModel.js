import { CakeReact } from '../CakeReactCore'; // Прямой импорт!
import { Validator } from '../index';

export class BaseModel {
  constructor(table, config = {}) {
    this.table = table;
    this.primaryKey = config.primaryKey || 'id';
    this.displayField = config.displayField || 'name';

    // Инициализация связей в стиле CakePHP
    this.belongsTo = config.belongsTo || {};
    this.hasMany = config.hasMany || {};

    this._validator = null;

    this.connectionName = config.connection || 'default';
  }

  get adapter() {
    return CakeReact.getAdapter(this.connectionName);
  }

  /**
   * Геттер для доступа к Supabase через централизованный сервис CakeReact.
   * Это позволяет модели не зависеть от путей импорта в конкретном проекте.
   */
  /* DELETE!
  get db() {
    return CakeReact.getService();
  }
    */

  /**
   * Генерирует строку запроса для Supabase на основе связей (JOIN-ы)
   * Аналог автоматического fetch-а в CakePHP
   */
  /* DELETE!
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
    */

  // Метод для настройки валидации (аналог validationDefault в CakePHP)
  get validator() {
    if (!this._validator) {
      this._validator = new Validator();
      this.validationDefault(this._validator);
    }
    return this._validator;
  }

  validationDefault(validator) {
    // Переопределяется в дочерних классах
    return validator;
  }

  // Найти все записи с учетом связей
  /* DELETE!
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
    */

  async find(options = {}) {
    console.log(`[🎂 CakeReact]:new find method`);
    // Передаем таблицу и описание связей адаптеру
    return await this.adapter.find(this.table, options, {
      belongsTo: this.belongsTo,
      hasMany: this.hasMany
    });
  }

  // Найти одну запись по ID
  async findById(id) {
    return await this.adapter.findById(this.table, id, this.primaryKey, {
      belongsTo: this.belongsTo,
      hasMany: this.hasMany
    });
  }

  // Сохранить (Create или Update) - в стиле CakePHP save()
  async save(data) {
    // 1. Валидация
    const errors = await this.validator.validate(data);
    if (errors !== true) {
      throw { type: 'ValidationError', errors };
    }

    // Создаем объект события, похожий на CakePHP Event
    const event = {
      name: 'Model.beforeSave',
      subject: this,
      data: { ...data }, // Копия данных для обработки
      stopped: false,
      result: true
    };

    console.log(`[🎂 CakeReact]: ${this}`);
    // 1. Вызов локального хука в модели
    if (this.beforeSave) {
      const hookResult = await this.beforeSave(event.data);
      console.log(`[🎂 CakeReact]: ${hookResult}`);
      if (hookResult === false) return false; // Остановка сохранения
    }

    // 2. Глобальное событие (через шину)
    // Мы передаем объект event по ссылке. Обработчики могут менять event.data
    await CakeReact.emit('Model.beforeSave', event);

    if (event.stopped) return false; // Если плагин остановил сохранение

    // Используем (возможно модифицированные) данные из события
    const dataToSave = event.data;
    const isNew = !dataToSave[this.primaryKey];

    const result = isNew
      ? await this.adapter.create(this.table, dataToSave)
      : await this.adapter.update(this.table, dataToSave, this.primaryKey);

    if (result.error) throw result.error;

    // После сохранения генерируем afterSave
    const afterEvent = { model: this, data: result.data, isNew };
    if (this.afterSave) await this.afterSave(result.data, isNew);
    CakeReact.emit('Model.afterSave', afterEvent);

    return result.data[0];
  }

  /** DELETE!
    async delete(id) {
      const { error } = await this.db // Используем динамический клиент
        .from(this.table)
        .delete()
        .eq(this.primaryKey, id);
  
      if (error) throw error;
      return true;
    }
      */

  // Удалить
  async delete(id) {
    const event = {
      name: 'Model.beforeDelete',
      subject: this,
      id: id,           // Передаем ID удаляемой записи
      stopped: false,   // Флаг для отмены удаления
    };

    // 1. Локальный хук модели
    // Если метод возвращает false — прерываем выполнение
    if (this.beforeDelete) {
      const hookResult = await this.beforeDelete(id);
      if (hookResult === false) {
        console.log(`[🎂 CakeReact] Deletion stopped by local hook in ${this.table}`);
        return false;
      }
    }

    // 2. Глобальное событие (для плагинов)
    // Ждем, пока все плагины отработают
    await CakeReact.emit('Model.beforeDelete', event);

    // Если какой-то плагин выставил event.stopped = true — прерываем
    if (event.stopped) {
      console.log(`[🎂 CakeReact] Deletion stopped by event listener for ${this.table}`);
      return false;
    }

    // 3. Само удаление в БД
    // Используем id из события (на случай, если плагин его подменил, что редко, но возможно)
    //const result = await this.db.from(this.table).delete().eq(this.primaryKey, event.id);
    const result = await this.adapter.delete(this.table, event.id, this.primaryKey);

    if (result.error) throw result.error;

    // 4. После удаления
    if (this.afterDelete) {
      await this.afterDelete(event.id);
    }

    CakeReact.emit('Model.afterDelete', {
      model: this,
      id: event.id
    });

    return true;
  }
}