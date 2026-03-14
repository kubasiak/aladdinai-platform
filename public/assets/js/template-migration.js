/**
 * Template System Migration Script
 * Migrates existing customers from flat settings to template-based settings
 */

const TemplateMigration = {
    /**
     * Check if customer needs migration to template system
     * @param {Object} settings - Current customer settings
     * @returns {boolean} True if migration needed
     */
    needsMigration(settings) {
        // If templateType exists, already migrated
        if (settings.templateType) {
            return false;
        }

        // If settings has old flat structure, needs migration
        if (settings.companyName || settings.aboutTitle || settings.contactEmail) {
            return true;
        }

        return false;
    },

    /**
     * Migrate customer settings to template system
     * @param {Object} oldSettings - Current flat settings
     * @returns {Object} New template-based settings
     */
    migrateToTemplateSystem(oldSettings) {
        console.log('🔄 Migrating to template system...');

        // Create classic template settings from flat structure
        const classicSettings = {
            hero: {
                companyName: oldSettings.companyName || 'AladdinAI',
                tagline: oldSettings.tagline || 'Creating Innovative Tools Based on Agentic AI'
            },
            about: {
                title: oldSettings.aboutTitle || 'About Us',
                text1: oldSettings.aboutText1 || '',
                text2: oldSettings.aboutText2 || ''
            },
            contact: {
                email: oldSettings.contactEmail || 'contact@company.com',
                phone: oldSettings.contactPhone || '+48 123 456 789',
                address: oldSettings.contactAddress || 'Warsaw, Poland'
            },
            styling: {
                titleSize: oldSettings.titleSize || 4,
                bodySize: oldSettings.bodySize || 1.1,
                fontColor: oldSettings.fontColor || '#ffffff',
                minTransparency: oldSettings.minTransparency || 20,
                maxTransparency: oldSettings.maxTransparency || 90,
                animDuration: oldSettings.animDuration || 10.7,
                videoSpeed: oldSettings.videoSpeed || 100
            }
        };

        // Create new settings structure
        const newSettings = {
            // Template metadata
            templateType: 'classic',
            templateVersion: '1.0',

            // Preserve media selections (template-agnostic)
            selectedVideoId: oldSettings.selectedVideoId || null,
            selectedAudioId: oldSettings.selectedAudioId || null,
            cardBackground: oldSettings.cardBackground || null,

            // Template-specific settings
            classic: classicSettings,

            // Preserve any custom fields (for safety)
            _migrated: true,
            _migrationDate: new Date().toISOString(),
            _backupSettings: { ...oldSettings } // Keep backup for rollback
        };

        console.log('✅ Migration complete - converted to Classic template');
        return newSettings;
    },

    /**
     * Rollback migration (restore from backup)
     * @param {Object} settings - Current template-based settings
     * @returns {Object} Original flat settings
     */
    rollbackMigration(settings) {
        if (!settings._backupSettings) {
            throw new Error('No backup settings found - cannot rollback');
        }

        console.log('⏪ Rolling back migration...');
        return settings._backupSettings;
    },

    /**
     * Automatically run migration if needed
     * @param {Object} settings - Current settings
     * @param {Function} saveCallback - Function to save migrated settings
     * @returns {Promise<Object>} Migrated settings (or original if no migration needed)
     */
    async autoMigrate(settings, saveCallback) {
        if (!this.needsMigration(settings)) {
            console.log('✓ Settings already on template system');
            return settings;
        }

        console.log('🔄 Auto-migrating to template system...');

        const migratedSettings = this.migrateToTemplateSystem(settings);

        // Save migrated settings
        if (saveCallback) {
            try {
                await saveCallback(migratedSettings);
                console.log('✅ Migrated settings saved successfully');
            } catch (error) {
                console.error('❌ Failed to save migrated settings:', error);
                throw error;
            }
        }

        return migratedSettings;
    }
};

// Make available globally
if (typeof window !== 'undefined') {
    window.TemplateMigration = TemplateMigration;
}

// Export for Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TemplateMigration;
}
