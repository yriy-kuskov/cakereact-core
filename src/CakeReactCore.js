export const CakeReact = {
  _service: null,
  _plugins: {},
  _events: {},
  _connections: {},
  _storages: {},

  addConnection(name, { client, adapter }) {
    // Мы сохраняем и сам клиент, и адаптер, который умеет с ним работать
    this._connections[name] = {
      client: client,
      adapter: new adapter(client)
    };
  },

  getAdapter(name = 'default') {
    return this._connections[name].adapter;
  },

  // Регистрация хранилища
  addStorage(name, { client, adapter, bucket }) {
    this._storages[name] = new adapter(client, bucket);
  },

  // Доступ к хранилищу
  storage(name = 'default') {
    if (!this._storages[name]) throw new Error(`Storage "${name}" not found.`);
    return this._storages[name];
  },

  // Метод для получения клиента внутри движка
  getService() {
    if (!this._service) {
      throw new Error('❌ CakeReact: Supabase не инициализирован. Вызовите CakeReact.init(supabase) в начале приложения.');
    }
    return this._service;
  },

  // Метод для регистрации плагина
  addPlugin(name, pluginInstance) {
    this._plugins[name] = pluginInstance;
    if (pluginInstance.initialize) {
      pluginInstance.initialize(this);
    }
  },

  /**
   * НОВЫЙ МЕТОД РЕГИСТРАЦИИ
   * Позволяет подключать плагины через CakeReact.use(MyPlugin)
   */
  use(plugin, options = {}) {
    if (!plugin.name) {
      console.error('❌ [CakeReact] Plugin registration failed: Plugin must have a name.');
      return this;
    }

    if (this._plugins[plugin.name]) {
      console.warn(`⚠️ [CakeReact] Plugin "${plugin.name}" is already registered.`);
      return this;
    }

    // Сохраняем ссылку
    this._plugins[plugin.name] = plugin;

    // Запускаем установку плагина
    if (typeof plugin.setup === 'function') {
      // Передаем this (само ядро CakeReact) и опции пользователя
      plugin.setup(this, options);
    }

    console.log(`🔌 [CakeReact] Plugin "${plugin.name}" installed.`);
    return this; // Возвращаем this для цепочки вызовов: .use().use()
  },

  // Получение плагина по имени
  // Получение плагина в любой части кода
  plugin(name) {
    const p = this._plugins[name];
    if (!p) console.warn(`[🎂 CakeReact] Плагин ${name} не зарегистрирован.`);
    return p;
  },

  /** Events System */
  // Подписка на событие
  on(event, callback) {
    if (!this._events[event]) this._events[event] = [];
    this._events[event].push(callback);
  },

  // Отписка
  off(event, callback) {
    if (!this._events[event]) return;
    this._events[event] = this._events[event].filter(cb => cb !== callback);
  },

  // Генерация события
  async emit(event, data) {
    console.log(`[🎂 CakeReact]: ${event}`);
    if (!this._events[event]) return;
    console.log(`[🎂 CakeReact]: ${event}`);
    // Используем for...of, чтобы дождаться выполнения всех обработчиков по очереди
    // (как это делает Middleware в серьезных фреймворках)
    for (const callback of this._events[event]) {
      await callback(data);
    }
  },
};