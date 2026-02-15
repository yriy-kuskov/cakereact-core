// src/Model/BaseModel.js
import { CakeReact } from '../CakeReactCore';
import { Validator } from './Validation/Validator';
import { BaseEntity } from './BaseEntity';

export class BaseModel {
  constructor(table, config = {}) {
    this.table = table;
    this.primaryKey = config.primaryKey || 'id';
    this.displayField = config.displayField || 'name';
    this.connectionName = config.connection || 'default';

    this.belongsTo = config.belongsTo || {};
    this.hasMany = config.hasMany || {};
    this.belongsToMany = config.belongsToMany || {};

    this._validator = null;
  }

  get adapter() {
    return CakeReact.getAdapter(this.connectionName);
  }

  /** Validation */
  get validator() {
    if (!this._validator) {
      this._validator = new Validator();
      this.validationDefault(this._validator);
    }
    return this._validator;
  }

  validationDefault(validator) {
    return validator;
  }

  /** Find Methods */
  async find(type = 'all', options = {}) {
    if (typeof type === 'object') {
      options = type;
      type = 'all';
    }

    const queryOptions = {
      conditions: {},
      contain: null,
      order: null,
      limit: type === 'first' ? 1 : null,
      ...options
    };

    const result = await this.adapter.find(this.table, queryOptions);

    if (type === 'first') {
      return result && result.length > 0 ? this._normalizeRow(result[0]) : null;
    }

    return this._normalizeResults(result);
  }

  async findById(id, options = {}) {
    const result = await this.adapter.findById(this.table, id, this.primaryKey, options);
    return result ? this._normalizeRow(result) : null;
  }

  /** Save & Delete */
  async save(entity) {
    const isNew = entity instanceof BaseEntity ? entity.isNew() : !entity[this.primaryKey];
    const eventName = isNew ? 'Model.beforeSave' : 'Model.beforeUpdate';

    const event = { name: eventName, subject: this, entity, stopped: false };
    await CakeReact.emit(eventName, event);
    if (event.stopped) return false;

    const data = entity instanceof BaseEntity ? entity.toArray() : entity;

    let result;
    if (isNew) {
      result = await this.adapter.create(this.table, data);
      if (entity instanceof BaseEntity && result) {
        entity._properties = { ...result };
        entity.clean();
      }
    } else {
      result = await this.adapter.update(this.table, data, this.primaryKey);
      if (entity instanceof BaseEntity) entity.clean();
    }

    await CakeReact.emit(isNew ? 'Model.afterSave' : 'Model.afterUpdate', { subject: this, entity });
    return entity;
  }

  async delete(id) {
    const event = { name: 'Model.beforeDelete', subject: this, id, stopped: false };
    if (this.beforeDelete && (await this.beforeDelete(id)) === false) return false;

    await CakeReact.emit('Model.beforeDelete', event);
    if (event.stopped) return false;

    const result = await this.adapter.delete(this.table, id, this.primaryKey);
    await CakeReact.emit('Model.afterDelete', { subject: this, id });
    return result;
  }

  /** Internal Helpers (Восстановлены!) */

  _normalizeResults(data) {
    if (!data || !Array.isArray(data)) return [];
    return data.map(row => this._normalizeRow(row));
  }

  _normalizeRow(row) {
    return this.createEntity(row, { new: false });
  }

  createEntity(data = {}, options = {}) {
    return new BaseEntity(data, { source: this, ...options });
  }

  /**
   * Возвращает список всех определенных связей
   */
  _getRelations() {
    return {
      belongsTo: this.belongsTo,
      hasMany: this.hasMany,
      belongsToMany: this.belongsToMany
    };
  }
}