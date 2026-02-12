## 3. Как теперь писать плагины
Теперь создание плагина выглядит профессионально и чисто.

Пример: Плагин для логирования действий в консоль (`ConsoleLogger.js`):
```javascript
import { definePlugin } from '@cakereact/core';

export default definePlugin({
  name: 'console-logger',
  
  // app - это ссылка на CakeReact
  // options - это то, что передали при подключении
  setup(app, options) {
    const prefix = options.prefix || '[LOG]';

    // Слушаем глобальное событие сохранения
    app.on('Model.afterSave', (event) => {
      console.log(`${prefix} Запись сохранена в таблицу ${event.model.table}, ID: ${event.data.id}`);
    });

    // Слушаем удаление
    app.on('Model.afterDelete', (event) => {
      console.warn(`${prefix} Запись удалена: ${event.id}`);
    });
  }
});
```
---

## 4. Как регистрировать плагины в приложении
В твоем основном файле (например, `main.jsx` или `App.jsx`), где ты инициализируешь `Supabase`:
```javascript
import { CakeReact } from '@cakereact/core';
import ConsoleLogger from './plugins/ConsoleLogger'; // Твой плагин
import BarcodeScanner from 'cakereact-plugin-barcode'; // Внешний плагин

// 1. Инициализация ядра
CakeReact.init(supabase);

// 2. Регистрация плагинов (цепочкой)
CakeReact
  .use(ConsoleLogger, { prefix: '>>' }) // С опциями
  .use(BarcodeScanner);                 // Без опций
```

### Плюсы такого подхода:
1. ****Изоляция:** Код плагина лежит внутри setup, он не загрязняет глобальную область видимости.

2. **Конфигурация:** Ты можешь передавать `options` (настройки) при подключении плагина (например, ключи API или цвета темы).

3. **Доступ к ядру:** Аргумент app внутри `setup(app)` дает плагину полный доступ к `on`, `emit`, `getService` (базе данных), что позволяет делать очень мощные вещи.