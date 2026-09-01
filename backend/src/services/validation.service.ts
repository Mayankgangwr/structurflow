import { ITargetSchema, ITargetSchemaField } from "@/models/template.model";
import { logger } from "@/utils/logger";

export interface ValidationError {
    field: string;
    message: string;
    severity: 'error' | 'warning';
}

export interface ValidationResult {
    isValid: boolean;
    confidence: number;
    errors: ValidationError[]
}

class ValidationService {
    validate(structuredData: Record<string, any>, targetSchema: ITargetSchema): ValidationResult {
        const errors: ValidationError[] = [];
        let matchedFields = 0;

        for (const field of targetSchema.fields) {
            const value = structuredData[field.name];

            if (field.required && (value === null || value === undefined || value === "")) {
                errors.push({
                    field: field.name,
                    message: `Required field "${field.name}" is missing`, severity: "error"
                });
                continue;
            }

            if (value === null || value === undefined) continue;

            const typeError = this.validateType(field, value);
            if (typeError) {
                errors.push(typeError);
                continue;
            }

            matchedFields++;
        }

        // Warn on unexpected fields
        const schemaNames = new Set(targetSchema.fields.map(f => f.name));
        for (const key of Object.keys(structuredData)) {
            if (!schemaNames.has(key)) {
                errors.push({
                    field: key,
                    message: `Unexpected field "${key}"`,
                    severity: 'warning'
                });
            }
        }

        const totalRequired = targetSchema.fields.filter(f => f.required).length;
        const totalFields = targetSchema.fields.length;
        const errorCount = errors.filter(e => e.severity === 'error').length;

        const confidence = totalFields > 0
            ? Math.max(0, (matchedFields / totalFields) * (1 - errorCount / Math.max(totalRequired, 1)))
            : 0;

        const isValid = errorCount === 0;

        logger.info(`
            Validation: valid=${isValid},
            confidence=${confidence.toFixed(2)}, errors=${errors.length}`
        );

        return {
            isValid,
            confidence: Math.round(confidence * 100) / 100, errors
        };
    }


    private validateType(field: ITargetSchemaField, value: any): ValidationError | null {

        switch (field.type) {
            case "string":
                if (typeof value !== 'string')
                    return {
                        field: field.name,
                        message: `Expected string, got ${typeof value}`,
                        severity: 'error'
                    };
                break;
            case 'number':
                const num = typeof value === 'string' ? Number(value) : value;
                if (typeof num !== 'number' || isNaN(num))
                    return {
                        field: field.name, message: `Expected number, got "${value}"`,
                        severity: 'error'
                    }
                break;
            case 'date':
                if (typeof value !== 'string' || isNaN(Date.parse(value)))
                    return { field: field.name, message: `Invalid date: "${value}"`, severity: 'error' };
                break;
            case 'boolean':
                if (typeof value !== 'boolean')
                    return { field: field.name, message: `Expected boolean, got ${typeof value}`, severity: 'error' };
                break;
            case 'array':
                if (!Array.isArray(value))
                    return { field: field.name, message: `Expected array, got ${typeof value}`, severity: 'error' };
                break;
            case 'object':
                if (typeof value !== 'object' || Array.isArray(value) || value === null)
                    return { field: field.name, message: `Expected object, got ${typeof value}`, severity: 'error' };
                break;
        }
        return null;
    }
}

const validationService = new ValidationService();
export default validationService;