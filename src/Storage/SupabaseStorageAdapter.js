// src/Storage/SupabaseStorageAdapter.js
import { BaseStorageAdapter } from './BaseStorageAdapter';

export class SupabaseStorageAdapter extends BaseStorageAdapter {
    async upload(path, file) {
        const { data, error } = await this.client.storage
            .from(this.bucket)
            .upload(path, file, { upsert: true });

        if (error) throw error;
        return data.path; // Возвращаем путь к файлу
    }

    async delete(path) {
        const { error } = await this.client.storage.from(this.bucket).remove([path]);
        if (error) throw error;
        return true;
    }

    async getUrl(path) {
        const { data } = this.client.storage.from(this.bucket).getPublicUrl(path);
        return data.publicUrl;
    }
}