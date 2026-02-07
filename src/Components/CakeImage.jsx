import React, { useState } from 'react';

export const CakeImage = ({ 
  src, 
  alt = "Изображение", 
  className = "w-10 h-10 object-cover rounded shadow-sm",
  zoomable = false 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!src) {
    return (
      <div className={`${className} bg-gray-100 flex items-center justify-center text-[10px] text-gray-400`}>
        НЕТ ФОТО
      </div>
    );
  }

  return (
    <>
      {/* Миниатюра */}
      <img
        src={src}
        alt={alt}
        className={`${className} ${zoomable ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
        onClick={() => zoomable && setIsModalOpen(true)}
      />

      {/* Модальное окно (Lightbox) */}
      {zoomable && isModalOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            {/* Кнопка закрытия */}
            <button 
              className="absolute -top-10 right-0 text-white text-3xl hover:text-gray-300"
              onClick={() => setIsModalOpen(false)}
            >
              &times;
            </button>
            
            <img
              src={src}
              alt={alt}
              className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain bg-white"
              onClick={(e) => e.stopPropagation()} // Чтобы не закрывалось при клике на саму картинку
            />
            
            {alt && (
              <p className="text-white text-center mt-4 font-medium text-lg italic">
                {alt}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
};