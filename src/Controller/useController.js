import { useState, useCallback } from 'react';

export const useController = (model) => {
  const [data, setData] = useState([]);
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Аналог index() в CakePHP - получение списка
  const getList = useCallback(async (options = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await model.find(options);
      setData(result);
      return result;
    } catch (err) {
      setError(err.message);
      console.error(`[🎂 CakeReact -> useController]: Error in getList:`, err);
    } finally {
      setLoading(false);
    }
  }, [model]);

  // Аналог view() в CakePHP - получение одной записи
  const getRecord = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const result = await model.findById(id);
      setRecord(result);
      return result;
    } catch (err) {
      setError(err.message);
      console.error(`[🎂 CakeReact -> useController]: Error in getRecord:`, err);
    } finally {
      setLoading(false);
    }
  }, [model]);

  /** DELETE!
   * // Аналог save() в CakePHP (создание и обновление)
  const save = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await model.save(formData);
      // Если мы обновляли запись в списке, подменяем её
      setData(prev => {
        const index = prev.findIndex(item => item[model.primaryKey] === result[model.primaryKey]);
        if (index !== -1) {
          const newData = [...prev];
          newData[index] = result;
          return newData;
        }
        return [result, ...prev]; // Если новая — добавляем в начало
      });
      return { success: true, data: result };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };
  */

  // Аналог save() в CakePHP (создание и обновление)
  const save = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await model.save(formData);

      // ДОБАВЛЕНА ПРОВЕРКА: Если сохранение было отменено (валидация или beforeSave)
      if (result === false) {
        // Можно вернуть ошибку или просто false, зависит от логики
        return { success: false, error: 'Сохранение отменено плагином или хуком.' };
      }

      // Если мы обновляли запись в списке, подменяем её
      setData(prev => {
        // Здесь result уже точно объект с данными
        const index = prev.findIndex(item => item[model.primaryKey] === result[model.primaryKey]);

        // ... остальной код обновления стейта ...
        if (index !== -1) {
          const newData = [...prev];
          newData[index] = result;
          return newData;
        }
        return [result, ...prev];
      });
      return { success: true, data: result };
    } catch (err) {
      setError(err.message);
      // Логируем ошибку, чтобы видеть реальную причину (Supabase error и т.д.)
      console.error("[CakeReact Controller Error]", err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Аналог delete() в CakePHP
  const remove = async (id) => {
    setLoading(true);
    setError(null);
    try {
      await model.delete(id);
      setData(prev => prev.filter(item => item[model.primaryKey] !== id));
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    record,
    loading,
    error,
    getList,
    getRecord,
    save,
    remove,
    setRecord // Полезно для сброса формы
  };
};