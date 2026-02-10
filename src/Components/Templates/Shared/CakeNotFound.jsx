import React from 'react';
import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

/**
 * Универсальная страница 404 для CakeReact
 * @param {string} icon - Emoji или текст для центрального блока
 * @param {string} imageSrc - Путь к картинке (если нужна вместо иконки)
 * @param {string} themeColor - Tailwind класс для акцентного цвета (например, 'text-rose-500')
 * @param {Array} categories - Массив объектов { name: 'Еда', path: '/food', icon: '🍕' }
 */
export const CakeNotFound = ({
  title = "Упс! Страница не найдена",
  message = "Похоже, этот «ингредиент» еще не добавили в наш рецепт. Возможно, адрес был изменен или страница была перемещена.",
  buttonText = "Вернуться домой",
  homePath = "/",
  icon = "404",
  imageSrc = null,
  categories = [], // Опциональный список категорий
  categories_title = "Популярные разделы",
  themeColor = "text-indigo-600"
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    // Если в истории больше 2 записей (текущая + предыдущая), идем назад.
    // Иначе — принудительно на главную (или homePath), чтобы не «зависать»
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate(homePath);
    }
  };

  useEffect(() => {
    document.title = `${title} | CakeReact`;
  }, [title]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 animate-fade-in">
      <div className="max-w-md w-full text-center">

        {/* Центральный визуальный блок */}
        <div className="mb-8 relative flex justify-center">
          {imageSrc ? (
            <img src={imageSrc} alt="Not Found" className="w-64 h-64 object-contain" />
          ) : (
            <span className={`text-9xl tracking-tighter font-black opacity-10 select-none absolute inset-0 flex items-center justify-center text-gray-400`}>
              404
            </span>
          )}
          {!imageSrc && (
            <div className={`relative text-7xl sm:text-8xl font-bold ${themeColor} drop-shadow-sm`}>
              {icon}
            </div>
          )}
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4 px-2">
          {title}
        </h1>

        <p className="text-gray-600 mb-8 leading-relaxed px-4 text-sm sm:text-base">
          {message}
        </p>

        {/* Группа кнопок навигации */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <button
            onClick={handleBack}
            className="w-full sm:w-auto px-8 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all active:scale-95"
          >
            Назад
          </button>
          <button
            onClick={() => navigate(homePath)}
            className={`w-full sm:w-auto px-8 py-3 bg-indigo-600 text-white font-medium rounded-xl shadow-lg shadow-indigo-100 hover:brightness-110 transition-all active:scale-95`}
          >
            {buttonText}
          </button>
        </div>

        {/* Декоративные точки (фирменный стиль Cake) */}
        <div className="mt-12 flex justify-center gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className={`w-2.5 h-2.5 rounded-full bg-current opacity-${20 + (i * 20)} ${themeColor}`}></div>
          ))}
        </div>

        {/* --- СЕКЦИЯ КАТЕГОРИЙ (Опционально) --- */}
        {categories.length > 0 && (
          <div className="mt-6 pt-6 animate-fade-in-up">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-8 text-center">
              {categories_title}
            </h2>
            <div className="grid grid-cols-2 gap-4 px-4">
              {categories.map((cat, idx) => (
                <Link
                  key={idx}
                  to={cat.path}
                  className="flex flex-col items-center p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-200 hover:-translate-y-1 transition-all group"
                >
                  <span className="text-3xl mb-3 group-hover:scale-110 transition-transform">
                    {cat.icon || '📁'}
                  </span>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-600">
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};