[⬅️Назад](./README.md)
#### 1. Создаем первый тест-страж: `tests/ai_guardrails/BaseModel.integrity.test.js`

В Vitest мы будем использовать `vi.spyOn`, чтобы следить за «внутренностями» методов.

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseModel } from '../../src/Model/BaseModel';
import { CakeReact } from '../../src/CakeReactCore';

// Мок для адаптера, чтобы тесты не падали из-за отсутствия БД
const mockAdapter = {
    find: vi.fn(() => Promise.resolve([])),
    findById: vi.fn(() => Promise.resolve(null)),
};

describe('AI Guardrail: BaseModel Integrity', () => {
    let model;

    beforeEach(() => {
        model = new BaseModel('posts');
        // Подменяем адаптер
        vi.spyOn(CakeReact, 'getAdapter').mockReturnValue(mockAdapter);
    });

    it('должен содержать ВСЕ обязательные методы (защита от удаления)', () => {
        const requiredMethods = [
            'find', 'findById', 'save', 'delete', 
            '_normalizeResults', '_normalizeRow', '_getRelations',
            'validationDefault', 'createEntity'
        ];

        requiredMethods.forEach(method => {
            expect(typeof model[method]).toBe('function', `Метод ${method} был удален!`);
        });
    });

    it('find() должен обязательно вызывать _normalizeRow для каждой записи', async () => {
        // Подкладываем данные
        mockAdapter.find.mockResolvedValueOnce([{ id: 1 }, { id: 2 }]);
        
        // Шпионим за внутренним методом
        const normalizeSpy = vi.spyOn(model, '_normalizeRow');

        await model.find('all');

        expect(normalizeSpy).toHaveBeenCalledTimes(2);
        expect(normalizeSpy).toHaveBeenCalledWith({ id: 1 });
    });

    it('save() должен вызывать события beforeSave и afterSave', async () => {
        const emitSpy = vi.spyOn(CakeReact, 'emit');
        const entity = model.createEntity({ title: 'Test' });

        await model.save(entity);

        // Проверяем, что события были вызваны
        expect(emitSpy).toHaveBeenCalledWith('Model.beforeSave', expect.any(Object));
        expect(emitSpy).toHaveBeenCalledWith('Model.afterSave', expect.any(Object));
    });
});

```

---

### 🤖 Как мы зафиксируем это в моих "инструкциях"

Теперь, когда у нас есть такие тесты, мы договоримся о следующем:

1. **Source of Truth**: Твой файл `project_context.txt` и папка `tests/ai_guardrails` — это священный Грааль.
2. **Self-Check**: Перед тем как выдать мне код, я должен мысленно (или через `ds_python_interpreter`, если бы он был настроен на запуск тестов) «прогнать» эти тесты.
3. **Warning**: Если я предлагаю изменение, которое удаляет метод из списка `requiredMethods`, я обязан обосновать это жирным шрифтом в начале сообщения.

### Что это дает тебе?

* **Уверенность**: Если я пришлю код без `_normalizeRow`, ты просто запустишь тесты, увидишь красный цвет и скажешь: «Бот, ты провалил guardrail-тест. Исправляй».
* **Документация**: Эти тесты сами по себе являются лучшим описанием того, как должен работать движок.

**Как тебе такая идея с "автоматическим контролем качества" моих ответов?** Если согласен, я могу помочь составить полный список методов для всех базовых классов (Entity, Adapter, Controller), которые мы внесем в эти тесты.