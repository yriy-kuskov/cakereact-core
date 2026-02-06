// src/cakereact/src/index.js

let supabaseInstance = null;

export const CakeReact = {
  // Метод для "заправки" нашего движка
  init: (supabaseClient) => {
    supabaseInstance = supabaseClient;
    console.log('🎂 CakeReact: Инициализация прошла успешно!');
  },

  // Метод для получения клиента внутри движка
  getService: () => {
    if (!supabaseInstance) {
      throw new Error('❌ CakeReact: Supabase не инициализирован. Вызовите CakeReact.init(supabase) в начале приложения.');
    }
    return supabaseInstance;
  }
};

// Экспортируем всё основное отсюда, чтобы было удобно импортировать
export { BaseModel } from './Model/BaseModel';