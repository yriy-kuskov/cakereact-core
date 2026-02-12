// src/Storage/BaseStorageAdapter.js
export class BaseStorageAdapter {
    constructor(client, bucket) {
        this.client = client;
        this.bucket = bucket;
    }

    // Метод для загрузки
    async upload(path, file) { throw new Error('upload() not implemented'); }

    // Метод для удаления
    async delete(path) { throw new Error('delete() not implemented'); }

    // Получение прямой ссылки
    async getUrl(path) { throw new Error('getUrl() not implemented'); }
}