/**
 * Template Registry System
 * Central registry for all page templates
 */

class TemplateRegistry {
    constructor() {
        this.templates = new Map();
    }

    /**
     * Register a new template
     * @param {string} templateId - Unique template identifier
     * @param {Object} definition - Template definition object
     * @param {string} definition.id - Template ID (must match templateId)
     * @param {string} definition.name - Display name
     * @param {string} definition.description - Template description
     * @param {Object} definition.schema - JSON Schema for settings validation
     * @param {Object} definition.defaultSettings - Default settings object
     * @param {Function} definition.generateHTML - Function to generate static HTML
     * @param {Function} definition.generateAdminPanel - Function to generate admin panel HTML
     * @throws {Error} If template validation fails
     */
    register(templateId, definition) {
        // Validate template definition
        this._validateTemplate(templateId, definition);

        // Register template
        this.templates.set(templateId, definition);
        console.log(`✅ Template registered: ${templateId} (${definition.name})`);
    }

    /**
     * Get a registered template
     * @param {string} templateId - Template identifier
     * @returns {Object} Template definition
     * @throws {Error} If template not found
     */
    get(templateId) {
        const template = this.templates.get(templateId);
        if (!template) {
            throw new Error(`Template not found: ${templateId}`);
        }
        return template;
    }

    /**
     * Get all registered templates
     * @returns {Array<Object>} Array of template definitions
     */
    getAll() {
        return Array.from(this.templates.values());
    }

    /**
     * Check if a template is registered
     * @param {string} templateId - Template identifier
     * @returns {boolean} True if template exists
     */
    has(templateId) {
        return this.templates.has(templateId);
    }

    /**
     * Get template IDs
     * @returns {Array<string>} Array of template IDs
     */
    getIds() {
        return Array.from(this.templates.keys());
    }

    /**
     * Validate template definition
     * @private
     */
    _validateTemplate(templateId, definition) {
        // Check ID matches
        if (definition.id !== templateId) {
            throw new Error(
                `Template ID mismatch: expected "${templateId}", got "${definition.id}"`
            );
        }

        // Check required fields
        const requiredFields = [
            'id',
            'name',
            'description',
            'schema',
            'defaultSettings',
            'generateHTML',
            'generateAdminPanel'
        ];

        for (const field of requiredFields) {
            if (!(field in definition)) {
                throw new Error(
                    `Template "${templateId}" missing required field: ${field}`
                );
            }
        }

        // Check function types
        if (typeof definition.generateHTML !== 'function') {
            throw new Error(
                `Template "${templateId}": generateHTML must be a function`
            );
        }

        if (typeof definition.generateAdminPanel !== 'function') {
            throw new Error(
                `Template "${templateId}": generateAdminPanel must be a function`
            );
        }

        // Check schema is object
        if (typeof definition.schema !== 'object' || definition.schema === null) {
            throw new Error(
                `Template "${templateId}": schema must be an object`
            );
        }

        // Check defaultSettings is object
        if (typeof definition.defaultSettings !== 'object' || definition.defaultSettings === null) {
            throw new Error(
                `Template "${templateId}": defaultSettings must be an object`
            );
        }
    }

    /**
     * Validate settings against template schema
     * @param {string} templateId - Template identifier
     * @param {Object} settings - Settings to validate
     * @returns {Object} Validation result { valid: boolean, errors: Array }
     */
    validateSettings(templateId, settings) {
        const template = this.get(templateId);
        const schema = template.schema;

        // Basic validation (can be extended with JSON Schema validator)
        const errors = [];
        const valid = this._validateObject(settings, schema, '', errors);

        return { valid, errors };
    }

    /**
     * Recursive object validation
     * @private
     */
    _validateObject(obj, schema, path, errors) {
        if (!schema.properties) {
            return true;
        }

        let valid = true;

        // Check required fields
        if (schema.required) {
            for (const field of schema.required) {
                if (!(field in obj)) {
                    errors.push(`Missing required field: ${path}${field}`);
                    valid = false;
                }
            }
        }

        // Validate each property
        for (const [key, value] of Object.entries(obj)) {
            const fieldSchema = schema.properties[key];
            if (!fieldSchema) {
                // Unknown field - not necessarily an error
                continue;
            }

            const fieldPath = path ? `${path}.${key}` : key;

            // Type validation
            if (fieldSchema.type) {
                const actualType = Array.isArray(value) ? 'array' : typeof value;
                if (actualType !== fieldSchema.type && value !== null) {
                    errors.push(
                        `Invalid type for ${fieldPath}: expected ${fieldSchema.type}, got ${actualType}`
                    );
                    valid = false;
                }
            }

            // Recursive validation for objects
            if (fieldSchema.type === 'object' && value !== null) {
                if (!this._validateObject(value, fieldSchema, fieldPath + '.', errors)) {
                    valid = false;
                }
            }

            // Array validation
            if (fieldSchema.type === 'array' && Array.isArray(value)) {
                if (fieldSchema.items) {
                    value.forEach((item, index) => {
                        if (fieldSchema.items.type === 'object') {
                            if (!this._validateObject(item, fieldSchema.items, `${fieldPath}[${index}].`, errors)) {
                                valid = false;
                            }
                        }
                    });
                }
            }
        }

        return valid;
    }
}

// Create singleton instance
const templateRegistry = new TemplateRegistry();

// Make available globally
if (typeof window !== 'undefined') {
    window.TemplateRegistry = templateRegistry;
}

// Export for Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = templateRegistry;
}
