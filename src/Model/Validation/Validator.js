import { ValidationRules } from "../../index";

export class Validator {
    constructor() {
        this._rules = {}; // { field: [ { rule, message, params }, ... ] }
    }

    add(field, ruleName, options = {}) {
        if (!this._rules[field]) this._rules[field] = [];

        this._rules[field].push({
            rule: ruleName,
            message: options.message || `Invalid ${ruleName}`,
            params: options.params || null,
            last: options.last || false // Остановить проверку поля на этой ошибке?
        });
        return this;
    }

    async validate(data) {
        const errors = {};

        for (const field in this._rules) {
            const fieldValue = data[field];
            const rules = this._rules[field];

            for (const ruleObj of rules) {
                const { rule, message, params, last } = ruleObj;
                let isValid = true;

                if (typeof rule === 'function') {
                    isValid = await rule(fieldValue, data);
                } else if (ValidationRules[rule]) {
                    isValid = ValidationRules[rule](fieldValue, params);
                }

                if (!isValid) {
                    if (!errors[field]) errors[field] = [];
                    errors[field].push(message);
                    if (last) break;
                }
            }
        }

        return Object.keys(errors).length === 0 ? true : errors;
    }
}