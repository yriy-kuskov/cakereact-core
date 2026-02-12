export class BaseAdapter {
    constructor(client) {
        this.client = client;
    }

    // Эти методы должны быть реализованы в дочерних классах
    async find(table, options) { throw new Error('Method find() not implemented'); }
    async findById(table, id, primaryKey) { throw new Error('Method findById() not implemented'); }
    async create(table, data) { throw new Error('Method create() not implemented'); }
    async update(table, data, primaryKey) { throw new Error('Method update() not implemented'); }
    async delete(table, id, primaryKey) { throw new Error('Method delete() not implemented'); }
}