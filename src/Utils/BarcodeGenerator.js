import JsBarcode from 'jsbarcode';

export const BarcodeGenerator = {
  /**
   * Генерирует файл изображения штрихкода (PNG)
   * @param {string} value - Значение (например, EAN-13)
   * @param {Object} options - Настройки JsBarcode
   * @returns {Promise<File>}
   */
  async generateAsFile(value, options = {}) {
    if (!value) throw new Error("Значение штрихкода пустое");

    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement('canvas');
        JsBarcode(canvas, value, {
          format: 'EAN13',
          flat: true,
          width: 2,
          height: 100,
          displayValue: true,
          ...options
        });

        canvas.toBlob((blob) => {
          if (!blob) {
             reject(new Error("Не удалось создать Blob из Canvas"));
             return;
          }
          const file = new File([blob], `barcode-${value}.png`, { type: 'image/png' });
          resolve(file);
        }, 'image/png');
      } catch (err) {
        reject(err);
      }
    });
  }
};