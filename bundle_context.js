import fs from 'node:fs';
import path from 'node:path';

/**
 * Скрипт для склеивания всех файлов проекта в один текстовый. 
 * Это нужно для того, чтобы файл отдавать нейросети (Google GEM) - чтобы она видела весь код.
 * 
 * Это отличная идея! 
 * Для работы с большими проектами в рамках одного контекста «склеивание» файлов в один — это стандартная и очень эффективная практика. 
 * Я смогу анализировать весь проект целиком, понимая связи между компонентами, которые раньше были скрыты.
 * 
 * Чтобы ты не делал это вручную, я подготовил для тебя два варианта скриптов (на Node.js и Python), которые автоматически соберут весь твой проект cakereact-core в один текстовый файл.
 */

// Конфигурация
const OUTPUT_FILE = 'project_context.txt';
// Исключаем лишние папки и тяжелые файлы блокировки
const EXCLUDE_DIRS = ['node_modules', '.git', 'dist', 'build', 'docs', 'storage'];
const EXCLUDE_FILES = ['package-lock.json', 'project_context.txt', 'bundle_context.js'];
const INCLUDE_EXTS = ['.js', '.jsx', '.json', '.md', '.css'];

function readFiles(dir, allFiles = []) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            if (!EXCLUDE_DIRS.includes(file)) {
                readFiles(filePath, allFiles);
            }
        } else {
            // Проверяем расширение и отсутствие файла в списке исключений
            if (INCLUDE_EXTS.includes(path.extname(file)) && !EXCLUDE_FILES.includes(file)) {
                allFiles.push(filePath);
            }
        }
    });

    return allFiles;
}

const files = readFiles('.');
let combinedContent = `PROJECT STRUCTURE:\n${files.join('\n')}\n\n`;

files.forEach(file => {
    try {
        const content = fs.readFileSync(file, 'utf8');
        combinedContent += `\n--- FILE START: ${file} ---\n`;
        combinedContent += content;
        combinedContent += `\n--- FILE END: ${file} ---\n`;
    } catch (err) {
        console.error(`Ошибка при чтении ${file}:`, err.message);
    }
});

fs.writeFileSync(OUTPUT_FILE, combinedContent);
console.log(`✅ Готово! Файл очищен от мусора. Теперь в нем только суть.`);