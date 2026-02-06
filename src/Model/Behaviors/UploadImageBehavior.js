// src/cakereact/src/Model/Behaviors/UploadImageBehavior.js
import { CakeReact } from '../../index';

export class UploadImageBehavior {
  /**
   * @param {Object} config - { db_field: { folder: '...', transformers: [...] } }
   * @param {string} bucket - Бакет в Supabase
   */
  constructor(config = {}, bucket = 'images') {
    this.fieldConfig = config; 
    this.bucket = bucket;
  }

  get db() {
    return CakeReact.getService(); //
  }

  /**
   * Обработка всех загрузок для модели
   * @param {Object} data - Данные из формы (включая файлы)
   * @param {Object} model - Экземпляр модели (для поиска старых данных)
   */
  async processUploads(data, model) {
    for (const [field, settings] of Object.entries(this.fieldConfig)) {
      let file = data[field];

      if (file instanceof File) {
        // --- ЦЕПОЧКА ВЗАИМОДЕЙСТВИЯ ---
        // Если у поля есть трансформеры (например, оптимизация), прогоняем файл через них
        if (settings.transformers && Array.isArray(settings.transformers)) {
          for (const transform of settings.transformers) {
            file = await transform(file);
          }
        }

        // Удаление старого файла при обновлении
        if (data[model.primaryKey]) {
          const oldRecord = await model.findById(data[model.primaryKey]);
          if (oldRecord && oldRecord[field]) {
            await this.deleteFile(oldRecord[field]);
          }
        }

        const publicUrl = await this.upload(file, settings.folder);
        data[field] = publicUrl;
      }
    }
    return data;
  }

  async upload(file, folder) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    const { error } = await this.db.storage
      .from(this.bucket)
      .upload(filePath, file);

    if (error) throw error;

    const { data: { publicUrl } } = this.db.storage
      .from(this.bucket)
      .getPublicUrl(filePath);

    return publicUrl;
  }

  async deleteFile(url) {
    if (!url || typeof url !== 'string') return;
    try {
      const pathParts = url.split(`${this.bucket}/`);
      if (pathParts.length < 2) return;
      const filePath = pathParts[1];

      await this.db.storage.from(this.bucket).remove([filePath]);
    } catch (e) {
      console.warn("Файл не удален из storage:", e);
    }
  }

  /**
   * Метод для полной очистки всех файлов записи при её удалении
   */
  async deleteAllFiles(record) {
    for (const field of Object.keys(this.fieldConfig)) {
      if (record[field]) {
        await this.deleteFile(record[field]);
      }
    }
  }
}