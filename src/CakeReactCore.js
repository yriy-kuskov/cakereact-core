export const CakeReact = {
    _service: null,
    _plugins: {},
  
    // Метод для "заправки" нашего движка
    init(supabaseInstance) {
      this._service = supabaseInstance;
      console.log('🎂 CakeReact: Инициализация прошла успешно!');
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
  
    // Получение плагина по имени
    // Получение плагина в любой части кода
    plugin(name) {
      const p = this._plugins[name];
      if (!p) console.warn(`[🎂 CakeReact] Плагин ${name} не зарегистрирован.`);
      return p;
    }
  };