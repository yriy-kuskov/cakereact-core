// tests/mocks/MockSupabase.js

/**
 * Эмулятор клиента Supabase для тестов.
 * Позволяет проверять, какие запросы уходят, и возвращать подготовленные данные.
 */
export class MockSupabaseClient {
    constructor(mockData = {}) {
        this.mockData = mockData;
        this.lastQuery = {};
        this.responseToReturn = { data: null, error: null };
    }

    __setNextResponse(data, error = null) {
        this.responseToReturn = { data, error };
    }

    from(table) {
        this.lastQuery.table = table;
        this.lastQuery.filters = [];
        return new QueryBuilder(this, table);
    }
}

class QueryBuilder {
    constructor(client, table) {
        this.client = client;
        this.table = table;
    }

    select(columns = '*') {
        this.client.lastQuery.select = columns;
        return this; // Возвращаем this для цепочки вызовов
    }

    eq(column, value) {
        this.client.lastQuery.filters.push({ column, operator: 'eq', value });
        return this;
    }

    in(column, values) {
        this.client.lastQuery.filters.push({ column, operator: 'in', value: values });
        return this;
    }

    order(column, { ascending = true } = {}) {
        this.client.lastQuery.order = { column, ascending };
        return this;
    }

    // ВОТ ЧЕГО НЕ ХВАТАЛО:
    limit(count) {
        this.client.lastQuery.limit = count;
        return this;
    }

    range(from, to) {
        this.client.lastQuery.range = { from, to };
        return this;
    }

    single() {
        this.client.lastQuery.single = true;
        return this;
    }

    // Финальное выполнение
    then(callback) {
        const response = this.client.responseToReturn;

        // Если ответ не задан принудительно, пробуем найти в mockData
        if (!response.data && !response.error && this.client.mockData[this.table]) {
            let data = [...this.client.mockData[this.table]];
            // Тут можно добавить простую логику фильтрации, если нужно
            response.data = data;
        }

        return new Promise(resolve => resolve(response)).then(callback);
    }
}