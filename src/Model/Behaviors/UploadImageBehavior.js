// src/cakereact/src/Model/Behaviors/UploadImageBehavior.js
// TODO: переписать, используя Storage адаптеры - этот behavior должен быть универсальным: либо загружать с помощью указанного явно адаптера, либо использовать адаптер по-умолчанию default
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
    // 1. Загружаем старую запись один раз, если это редактирование
    let oldRecord = null;
    if (data[model.primaryKey]) {
      try {
        oldRecord = await model.findById(data[model.primaryKey]);
      } catch (e) {
        console.warn("[🎂 CakeReact -> UploadImageBehavior]: Не удалось найти старую запись для очистки файлов", e);
      }
    }

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
        // 2. Используем уже загруженную oldRecord
        if (oldRecord && oldRecord[field]) {
          // Важно: проверяем, изменился ли файл. Если загружают тот же самый - не удаляем.
          // Хотя input type="file" обычно не дает выбрать "текущий URL", проверка не помешает.
          if (oldRecord[field] !== file) {
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
      // 1. Убираем всё, что идет после знака вопроса (query params) или решетки
      // Например: image.jpg?t=123 -> image.jpg
      const cleanUrl = url.split('?')[0].split('#')[0];

      // 2. Разбиваем по имени бакета
      // Используем `${this.bucket}/` как разделитель
      const pathParts = cleanUrl.split(`${this.bucket}/`);

      // Если разделитель не найден или это не та ссылка, выходим
      if (pathParts.length < 2) {
        console.warn(`[🎂 CakeReact -> UploadImageBehavior]: Не удалось распарсить URL для удаления: ${url}`);
        return;
      }

      // 3. Берем часть пути после бакета
      // ВАЖНО: Декодируем URI (превращаем %20 обратно в пробелы, русские буквы и т.д.)
      const rawPath = pathParts.slice(1).join(`${this.bucket}/`); // join на случай, если имя бакета встречается в пути дважды (редко, но бывает)
      const filePath = decodeURIComponent(rawPath);

      console.log(`[🎂 CakeReact -> UploadImageBehavior]: Удаляем файл: ${filePath}`);

      const { error } = await this.db.storage
        .from(this.bucket)
        .remove([filePath]);

      if (error) throw error;

    } catch (e) {
      console.warn("[🎂 CakeReact -> UploadImageBehavior]: Файл не удален из storage:", e);
    }
  }

  /**
   * Метод для полной очистки всех файлов записи при её удалении
   */
  async deleteAllFiles(record) {
    for (const field of Object.keys(this.fieldConfig)) {
      if (record[field]) {
        await this.deleteFile(record[field]);
        console.log(`[🎂 CakeReact -> UploadImageBehavior]: Удаляем файл для поля: ${record[field]}`);
      }
    }
  }
}