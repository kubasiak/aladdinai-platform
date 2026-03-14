/**
 * Classic Template - Single Card Layout
 * The original AladdinAI template with hero, about, and contact sections
 */

(function() {
    'use strict';

    const ClassicTemplate = {
        id: 'classic',
        name: 'Classic Single Card',
        description: 'Simple, elegant single-card layout with hero, about, and contact sections',

        // JSON Schema for settings validation
        schema: {
            type: 'object',
            properties: {
                hero: {
                    type: 'object',
                    properties: {
                        companyName: { type: 'string' },
                        tagline: { type: 'string' }
                    },
                    required: ['companyName']
                },
                about: {
                    type: 'object',
                    properties: {
                        title: { type: 'string' },
                        text1: { type: 'string' },
                        text2: { type: 'string' }
                    },
                    required: ['title']
                },
                contact: {
                    type: 'object',
                    properties: {
                        email: { type: 'string' },
                        phone: { type: 'string' },
                        address: { type: 'string' }
                    }
                },
                styling: {
                    type: 'object',
                    properties: {
                        titleSize: { type: 'number' },
                        bodySize: { type: 'number' },
                        fontColor: { type: 'string' },
                        minTransparency: { type: 'number' },
                        maxTransparency: { type: 'number' },
                        animDuration: { type: 'number' },
                        videoSpeed: { type: 'number' }
                    }
                }
            },
            required: ['hero', 'about', 'contact', 'styling']
        },

        // Default settings
        defaultSettings: {
            hero: {
                companyName: 'AladdinAI',
                tagline: 'Creating Innovative Tools Based on Agentic AI'
            },
            about: {
                title: 'About Us',
                text1: 'Founded in 2026 in Warsaw, we bring together professionals from IT, AI, Sales, Business, and Innovation.',
                text2: 'We\'re pioneering the future of agentic AI, creating tools that empower businesses through intelligent automation.'
            },
            contact: {
                email: 'contact@company.com',
                phone: '+48 123 456 789',
                address: 'Warsaw, Poland'
            },
            styling: {
                titleSize: 4,
                bodySize: 1.1,
                fontColor: '#ffffff',
                minTransparency: 20,
                maxTransparency: 90,
                animDuration: 10.7,
                videoSpeed: 100
            }
        },

        /**
         * Generate static HTML for this template
         * @param {Object} settings - Template-specific settings
         * @param {Object} media - Media library data (videos, audio, backgrounds)
         * @param {string} baseUrl - Base URL for the site
         * @returns {Promise<string>} Complete HTML document
         */
        async generateHTML(settings, media, baseUrl = 'https://ai-webpages.web.app') {
            // Extract media URLs
            let videoUrl = '';
            let posterUrl = '';
            let audioUrl = '';

            if (media.selectedVideo && media.selectedVideo.url) {
                videoUrl = media.selectedVideo.url;
                posterUrl = media.cardBackground || media.selectedVideo.posterUrl || '';
            }

            if (media.selectedAudio && media.selectedAudio.url) {
                audioUrl = media.selectedAudio.url;
            }

            // Get inline CSS
            const inlineCSS = await this.getCSS();

            // Generate custom styles based on settings
            const customStyles = this.generateCustomStyles(settings.styling, media.cardBackground);

            const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${this.escapeHtml(settings.hero.companyName)} - ${this.escapeHtml(settings.hero.tagline)}">
    <title>${this.escapeHtml(settings.hero.companyName)}</title>
    <style>
        ${inlineCSS}
    </style>
    <style>
        ${customStyles}
    </style>
</head>
<body>
    ${this.generateVideoBackground(videoUrl, posterUrl, settings.styling.videoSpeed)}

    <div class="container">
        <div class="card">
            ${this.generateHero(settings.hero)}
            ${this.generateAbout(settings.about)}
            ${this.generateContact(settings.contact)}
            ${this.generateFooter(settings.hero.companyName)}
        </div>
    </div>

    ${this.generateAudio(audioUrl)}
</body>
</html>`;

            return html;
        },

        /**
         * Generate custom CSS styles based on settings
         */
        generateCustomStyles(styling, cardBackground) {
            return `
        .logo h1 { font-size: ${styling.titleSize}rem !important; }
        .about-text { font-size: ${styling.bodySize}rem !important; }
        body, h1, h2, h3, p, a { color: ${styling.fontColor} !important; }
        .video-overlay { animation-duration: ${styling.animDuration}s !important; }
        @keyframes videoFade {
            0% { background: rgba(0, 0, 0, ${1 - (styling.minTransparency / 100)}); }
            50% { background: rgba(0, 0, 0, ${1 - (styling.maxTransparency / 100)}); }
            100% { background: rgba(0, 0, 0, ${1 - (styling.minTransparency / 100)}); }
        }
        ${cardBackground ? `.card { background-image: url('${cardBackground}') !important; }` : ''}
            `.trim();
        },

        /**
         * Generate video background HTML
         */
        generateVideoBackground(videoUrl, posterUrl, videoSpeed) {
            if (!videoUrl) return '';

            return `<div class="video-background">
        <video autoplay muted loop playsinline playbackRate="${videoSpeed / 100}"${posterUrl ? ` poster="${posterUrl}"` : ''}>
            <source src="${videoUrl}" type="video/mp4">
        </video>
        <div class="video-overlay"></div>
    </div>`;
        },

        /**
         * Generate hero section HTML
         */
        generateHero(hero) {
            return `<header class="hero">
                <div class="logo">
                    <h1>${this.escapeHtml(hero.companyName)}</h1>
                </div>
                <p class="tagline">${this.escapeHtml(hero.tagline)}</p>
            </header>`;
        },

        /**
         * Generate about section HTML
         */
        generateAbout(about) {
            return `<section class="about">
                <h2>${this.escapeHtml(about.title)}</h2>
                <p class="about-text">${this.escapeHtml(about.text1)}</p>
                <p class="about-text">${this.escapeHtml(about.text2)}</p>
            </section>`;
        },

        /**
         * Generate contact section HTML
         */
        generateContact(contact) {
            return `<section class="contact">
                <div class="contact-grid">
                    <div class="contact-item">
                        <div class="contact-icon">📧</div>
                        <h3>Email</h3>
                        <a href="mailto:${this.escapeHtml(contact.email)}">${this.escapeHtml(contact.email)}</a>
                    </div>
                    <div class="contact-item">
                        <div class="contact-icon">📱</div>
                        <h3>Phone</h3>
                        <a href="tel:${contact.phone.replace(/\s/g, '')}">${this.escapeHtml(contact.phone)}</a>
                    </div>
                    <div class="contact-item">
                        <div class="contact-icon">📍</div>
                        <h3>Office</h3>
                        <p>${this.escapeHtml(contact.address)}</p>
                    </div>
                </div>
            </section>`;
        },

        /**
         * Generate footer HTML
         */
        generateFooter(companyName) {
            return `<footer>
                <p>&copy; ${new Date().getFullYear()} ${this.escapeHtml(companyName)}. All rights reserved.</p>
            </footer>`;
        },

        /**
         * Generate audio HTML
         */
        generateAudio(audioUrl) {
            if (!audioUrl) return '';

            return `<audio id="bgAudio" autoplay loop>
        <source src="${audioUrl}" type="audio/mpeg">
    </audio>
    <script>
        const audio = document.getElementById('bgAudio');
        if (audio) audio.volume = 0.3;
    </script>`;
        },

        /**
         * Get CSS for this template
         */
        async getCSS() {
            // In production, load from file
            // For now, return inline CSS
            try {
                const response = await fetch('/assets/css/styles.css');
                if (response.ok) {
                    return await response.text();
                }
            } catch (error) {
                console.warn('Could not load styles.css, using default');
            }
            return '';
        },

        /**
         * Generate admin panel HTML for this template
         * Returns empty string as the admin panel already exists
         */
        generateAdminPanel(settings) {
            // The admin panel is already built in admin.html
            // This method is for future templates that need custom admin interfaces
            return '';
        },

        /**
         * Escape HTML to prevent XSS
         */
        escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    };

    // Register template
    if (typeof window !== 'undefined' && window.TemplateRegistry) {
        window.TemplateRegistry.register('classic', ClassicTemplate);
    }

    // Export for Node.js if needed
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ClassicTemplate;
    }
})();
