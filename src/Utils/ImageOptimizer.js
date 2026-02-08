/**
 * Утилита для сжатия изображений на клиенте
 * Использует Canvas API для ресайза и сжатия
 */
export const ImageOptimizer = {
  /**
   * Основной метод сжатия
   * @param {File} file - Исходный файл
   * @param {Object} options - Настройки сжатия
   * @returns {Promise<File>} - Оптимизированный файл
   */
  async compress(file, options = {}) {
    // Дефолтные настройки
    const settings = {
      maxWidth: 1200,      // Максимальная ширина
      maxHeight: 1200,     // Максимальная высота
      quality: 0.8,        // Качество JPEG/WEBP (0 to 1)
      mimeType: 'image/jpeg', // Во что конвертировать (можно 'image/webp')
      ...options
    };

    // Если это не картинка, возвращаем как есть
    if (!file.type.startsWith('image/')) return file;

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        
        img.onload = () => {
          // 1. Вычисляем новые размеры, сохраняя пропорции
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > settings.maxWidth) {
              height = Math.round((height * settings.maxWidth) / width);
              width = settings.maxWidth;
            }
          } else {
            if (height > settings.maxHeight) {
              width = Math.round((width * settings.maxHeight) / height);
              height = settings.maxHeight;
            }
          }

          // 2. Рисуем на Canvas
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // 3. Конвертируем Canvas в Blob/File
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Image compression failed'));
              return;
            }
            
            // Создаем новый объект File с тем же именем, но обновленным типом и размером
            const optimizedFile = new File([blob], file.name, {
              type: settings.mimeType,
              lastModified: Date.now(),
            });

            console.log(`[🎂 CakeReact -> ImageOptimizer] Сжато: ${(file.size / 1024).toFixed(0)}KB -> ${(optimizedFile.size / 1024).toFixed(0)}KB`);
            resolve(optimizedFile);

          }, settings.mimeType, settings.quality);
        };
        
        img.onerror = (err) => reject(err);
      };
      
      reader.onerror = (err) => reject(err);
    });
  }
};