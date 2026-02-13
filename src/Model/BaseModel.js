import { CakeReact } from '../CakeReactCore'; // Прямой импорт!
import { Validator, BaseEntity } from '../index';

export class BaseModel {
  //TODO: В модели можно будет указывать правила сортировки в конфигах: belongsTo, hasMany, belongsToMany, и адаптер будет их считывать. Но пока вариант А — самый простой и рабочий для текущей архитектуры.
  constructor(table, config = {}) {
    this.table = table;
    this.primaryKey = config.primaryKey || 'id';
    this.displayField = config.displayField || 'name';

    // Инициализация связей в стиле CakePHP
    this.belongsTo = config.belongsTo || {};
    this.hasMany = config.hasMany || {};
    this.belongsToMany = config.belongsToMany || {};

    this._validator = null;

    this.connectionName = config.connection || 'default';
  }

  get adapter() {
    return CakeReact.getAdapter(this.connectionName);
  }

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

  // Позволяет указать свой класс Entity для конкретной модели
  getEntityClass() {
    return BaseEntity;
  }

  /*// Найти все записи с учетом связей
  async find(options = {}) {
    console.log(`[🎂 CakeReact]:new find method`);
    // Передаем таблицу и описание связей адаптеру
    return await this.adapter.find(this.table, options, {
      belongsTo: this.belongsTo,
      hasMany: this.hasMany,
      belongsToMany: this.belongsToMany
    });
  }

  // Найти одну запись по ID
  async findById(id) {
    return await this.adapter.findById(this.table, id, this.primaryKey, {
      belongsTo: this.belongsTo,
      hasMany: this.hasMany,
      belongsToMany: this.belongsToMany
    });
  }*/

  /**
   * Основной метод поиска
   */
  // src/Model/BaseModel.js

  async find(options = {}) {
    // Передаем options.contain (список нужных связей) в _getRelations
    const relations = this._getRelations(options.contain || null);

    const rawData = await this.adapter.find(this.table, options, relations);

    const normalizedData = rawData.map(row => this._normalizeRow(row));
    const EntityClass = this.getEntityClass();
    return normalizedData.map(row => new EntityClass(row, { source: this }));
  }

  async findById(id, options = {}) {
    // То же самое для поиска по ID
    const relations = this._getRelations(options.contain || null);

    const rawRow = await this.adapter.findById(this.table, id, this.primaryKey, relations);

    const normalizedRow = this._normalizeRow(rawRow);
    const EntityClass = this.getEntityClass();
    return new EntityClass(normalizedRow, { source: this });
  }

  /**
   * УНИВЕРСАЛЬНЫЙ НОРМАЛИЗАТОР
   * Превращает: { model_files: [{ sort: 1, files: {url: '...'} }] }
   * В: { images: [{ url: '...', _joinData: { sort: 1 } }] }
   */
  _normalizeRow(row) {
    if (!row) return row;
    const processed = { ...row };

    // Проходимся по всем настроенным связям belongsToMany
    if (this.belongsToMany) {
      Object.entries(this.belongsToMany).forEach(([alias, config]) => {
        // Ищем в ответе поле, соответствующее названию промежуточной таблицы (through)
        // Supabase возвращает данные именно под этим ключом (например, 'model_files')
        // Или под алиасом, если адаптер его использовал.

        // В нашем текущем адаптере мы не используем алиасы при запросе pivot, 
        // поэтому данные придут в поле config.through (например, 'model_files')
        const pivotData = processed[config.through];

        if (Array.isArray(pivotData)) {
          // Преобразуем массив
          processed[alias] = pivotData.map(item => {
            // item - это объект промежуточной таблицы { id: 1, sort_order: 0, files: {...} }

            // 1. Ищем данные целевой таблицы внутри (ключ = config.table, напр. 'files')
            const targetData = item[config.table];

            if (!targetData) return item; // Если что-то пошло не так

            // 2. Отделяем данные связи (всё кроме целевого объекта)
            const joinData = { ...item };
            delete joinData[config.table]; // Удаляем вложенный объект files

            // 3. Формируем красивый объект: Данные файла + _joinData
            return {
              ...targetData,
              _joinData: joinData
            };
          });

          // Удаляем старый ключ промежуточной таблицы, чтобы не мусорить
          // (если алиас отличается от имени таблицы)
          if (alias !== config.through) {
            delete processed[config.through];
          }
        }
      });
    }
    return processed;
  }

  // src/Model/BaseModel.js

  /**
   * Собирает и нормализует все связи модели.
   * * @param {Array} contain - (Опционально) Список алиасов, которые нужно включить. 
   * Если не передан, возвращаются ВСЕ связи.
   * Пример: ['category', 'images']
   */
  _getRelations(contain = null) {
    const allRelations = {
      belongsTo: this.belongsTo || {},
      hasMany: this.hasMany || {},
      belongsToMany: this.belongsToMany || {}
    };

    const result = {
      belongsTo: {},
      hasMany: {},
      belongsToMany: {}
    };

    // Проходим по всем типам связей (belongsTo, hasMany...)
    Object.keys(allRelations).forEach(type => {
      const relationsOfType = allRelations[type];

      Object.keys(relationsOfType).forEach(alias => {
        // 1. Фильтрация (аналог contain в CakePHP)
        // Если передан массив contain и текущего алиаса там нет — пропускаем
        if (contain && !contain.includes(alias)) {
          return;
        }

        const config = relationsOfType[alias];

        // 2. Нормализация (Convention over Configuration)
        // Если конфиг не задан (null), считаем пустым объектом
        const normalizedConfig = config || {};

        // Если имя таблицы не указано явно, используем алиас
        // Пример: this.belongsTo = { category: {} } -> table: 'categories' (или 'category')
        if (!normalizedConfig.table) {
          normalizedConfig.table = alias;
        }

        // 3. Записываем в результат
        result[type][alias] = normalizedConfig;
      });
    });

    return result;
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