/**
 * AImachine Template - Professional Multi-Section Website
 * Based on STATIC1 design with hero images, company intro, solutions, projects, and CTA
 */

(function() {
    'use strict';

    const AImachineTemplate = {
        id: 'aimachine',
        name: 'AImachine Professional',
        description: 'Professional multi-section website with hero images, solutions showcase, and project portfolio',

        // JSON Schema for settings validation
        schema: {
            type: 'object',
            properties: {
                branding: {
                    type: 'object',
                    properties: {
                        companyName: { type: 'string' },
                        tagline: { type: 'string' }
                    },
                    required: ['companyName']
                },
                navigation: {
                    type: 'object',
                    properties: {
                        links: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    label: { type: 'string' },
                                    href: { type: 'string' }
                                }
                            }
                        }
                    },
                    required: ['links']
                },
                heroSections: {
                    type: 'object',
                    properties: {
                        left: {
                            type: 'object',
                            properties: {
                                title: { type: 'string' },
                                subtitle: { type: 'string' },
                                buttonText: { type: 'string' },
                                buttonHref: { type: 'string' },
                                backgroundImage: { type: 'string' }
                            }
                        },
                        right: {
                            type: 'object',
                            properties: {
                                title: { type: 'string' },
                                subtitle: { type: 'string' },
                                buttonText: { type: 'string' },
                                buttonHref: { type: 'string' },
                                backgroundImage: { type: 'string' }
                            }
                        }
                    },
                    required: ['left', 'right']
                },
                features: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            title: { type: 'string' },
                            description: { type: 'string' }
                        }
                    }
                },
                solutions: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            title: { type: 'string' }
                        }
                    }
                },
                projects: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            image: { type: 'string' },
                            title: { type: 'string' }
                        }
                    }
                },
                cta: {
                    type: 'object',
                    properties: {
                        title: { type: 'string' },
                        highlightText: { type: 'string' },
                        buttonText: { type: 'string' },
                        buttonHref: { type: 'string' },
                        backgroundImage: { type: 'string' }
                    }
                },
                footer: {
                    type: 'object',
                    properties: {
                        description: { type: 'string' },
                        solutionsLinks: { type: 'array' },
                        projectsLinks: { type: 'array' },
                        contact: {
                            type: 'object',
                            properties: {
                                email: { type: 'string' },
                                phone: { type: 'string' },
                                address: { type: 'string' }
                            }
                        }
                    }
                }
            },
            required: ['branding', 'navigation', 'heroSections', 'solutions', 'projects', 'cta']
        },

        // Default settings
        defaultSettings: {
            branding: {
                companyName: 'AI MACHINE',
                tagline: 'Engineering company delivering advanced automation systems and intelligent buildings'
            },
            navigation: {
                links: [
                    { label: 'HOME', href: '#home' },
                    { label: 'PROJECTS', href: '#projects' },
                    { label: 'SOLUTIONS', href: '#solutions' },
                    { label: 'ABOUT', href: '#about' },
                    { label: 'SALES', href: '#sales' },
                    { label: 'CONTACT US', href: '#contact' }
                ]
            },
            heroSections: {
                left: {
                    title: 'Intelligent Machines',
                    subtitle: 'Automation for Industry',
                    buttonText: 'Explore AI Solutions',
                    buttonHref: '#solutions',
                    backgroundImage: '/templates/aimachine/media/hero-left.jpg'
                },
                right: {
                    title: 'Intelligent Buildings',
                    subtitle: 'Technology for Premium Living',
                    buttonText: 'See Our Projects',
                    buttonHref: '#projects',
                    backgroundImage: '/templates/aimachine/media/hero-right.jpg'
                }
            },
            features: [
                {
                    title: 'Industrial Automation',
                    description: 'Elevators, AGVs, Warehouse Systems'
                },
                {
                    title: 'Smart Infrastructure',
                    description: 'Hotels, Education, HVAC Control'
                }
            ],
            solutions: [
                { title: 'AMR & AGV' },
                { title: 'Warehouse Automation' },
                { title: 'Service Robots' },
                { title: 'Smart Security' }
            ],
            projects: [
                {
                    image: '/templates/aimachine/media/project-1.jpg',
                    title: 'Modern Warehouse'
                },
                {
                    image: '/templates/aimachine/media/project-2.jpg',
                    title: 'Luxury Villa'
                },
                {
                    image: '/templates/aimachine/media/project-3.jpg',
                    title: 'Business Hotel'
                },
                {
                    image: '/templates/aimachine/media/project-4.jpg',
                    title: 'Office Complex'
                }
            ],
            cta: {
                title: 'Build the Future with',
                highlightText: 'AI MACHINE',
                buttonText: 'Contact Us',
                buttonHref: '#contact',
                backgroundImage: '/templates/aimachine/media/cta-background.jpg'
            },
            footer: {
                description: 'Engineering company delivering advanced automation systems and intelligent buildings',
                solutionsLinks: ['AMR & AGV', 'Warehouse Automation', 'Service Robots', 'Smart Security'],
                projectsLinks: ['Industrial', 'Commercial', 'Residential', 'Infrastructure'],
                contact: {
                    email: 'info@aimachine.com',
                    phone: '+1 (555) 123-4567',
                    address: '123 Tech Street'
                }
            }
        },

        /**
         * Generate static HTML for this template
         */
        async generateHTML(settings, media, baseUrl = 'https://ai-webpages.web.app') {
            const inlineCSS = await this.getCSS();

            const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(settings.branding.companyName)} - Intelligent Machines & Buildings</title>
    <style>
        ${inlineCSS}
    </style>
</head>
<body>
    ${this.generateHeader(settings.branding, settings.navigation)}
    ${this.generateHeroSplit(settings.heroSections)}
    ${this.generateCompanyIntro(settings.branding, settings.features)}
    ${this.generateSolutions(settings.solutions)}
    ${this.generateProjects(settings.projects)}
    ${this.generateCTA(settings.cta)}
    ${this.generateFooter(settings.branding, settings.footer)}

    <!-- Admin Login Icon -->
    <a href="${baseUrl}/login.html" style="position: fixed; bottom: 20px; right: 20px; width: 50px; height: 50px; background: rgba(102, 126, 234, 0.9); border-radius: 50%; display: flex; align-items: center; justify-content: center; text-decoration: none; box-shadow: 0 4px 12px rgba(0,0,0,0.3); transition: all 0.3s; z-index: 9999;" onmouseover="this.style.background='rgba(102, 126, 234, 1)'; this.style.transform='scale(1.1)'" onmouseout="this.style.background='rgba(102, 126, 234, 0.9)'; this.style.transform='scale(1)'">
        <span style="font-size: 24px;">🔐</span>
    </a>
</body>
</html>`;

            return html;
        },

        /**
         * Generate header with navigation
         */
        generateHeader(branding, navigation) {
            const links = navigation.links.map(link => {
                const isContact = link.label.toUpperCase().includes('CONTACT');
                const className = isContact ? 'btn-contact' : '';
                return `<a href="${link.href}" class="${className}">${this.escapeHtml(link.label)}</a>`;
            }).join('\n                    ');

            return `    <!-- Header -->
    <header class="header">
        <div class="container">
            <div class="nav">
                <div class="logo">${this.escapeHtml(branding.companyName)}</div>
                <nav class="menu">
                    ${links}
                </nav>
            </div>
        </div>
    </header>`;
        },

        /**
         * Generate hero split section
         */
        generateHeroSplit(heroSections) {
            return `    <!-- Hero Section -->
    <section class="hero-split">
        <div class="hero-item hero-machines">
            <div class="hero-overlay"></div>
            <img src="${heroSections.left.backgroundImage}" alt="${this.escapeHtml(heroSections.left.title)}" class="hero-bg">
            <div class="hero-content">
                <h1>${this.escapeHtml(heroSections.left.title)}</h1>
                <p>${this.escapeHtml(heroSections.left.subtitle)}</p>
                <a href="${heroSections.left.buttonHref}" class="btn btn-primary">${this.escapeHtml(heroSections.left.buttonText)}</a>
            </div>
        </div>
        <div class="hero-item hero-buildings">
            <div class="hero-overlay"></div>
            <img src="${heroSections.right.backgroundImage}" alt="${this.escapeHtml(heroSections.right.title)}" class="hero-bg">
            <div class="hero-content">
                <h1>${this.escapeHtml(heroSections.right.title)}</h1>
                <p>${this.escapeHtml(heroSections.right.subtitle)}</p>
                <a href="${heroSections.right.buttonHref}" class="btn btn-success">${this.escapeHtml(heroSections.right.buttonText)}</a>
            </div>
        </div>
    </section>`;
        },

        /**
         * Generate company intro section
         */
        generateCompanyIntro(branding, features) {
            const featureCards = features.map(feature => `
                <div class="feature-card">
                    <div class="feature-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
                            <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
                            <line x1="6" y1="6" x2="6.01" y2="6"></line>
                            <line x1="6" y1="18" x2="6.01" y2="18"></line>
                        </svg>
                    </div>
                    <h3>${this.escapeHtml(feature.title)}</h3>
                    <p>${this.escapeHtml(feature.description)}</p>
                </div>`).join('');

            return `    <!-- Company Intro -->
    <section class="company-intro">
        <div class="container">
            <h2 class="company-logo">${this.escapeHtml(branding.companyName)}</h2>
            <p class="company-tagline">${this.escapeHtml(branding.tagline)}</p>

            <div class="features-grid">
                ${featureCards}
            </div>
        </div>
    </section>`;
        },

        /**
         * Generate solutions section
         */
        generateSolutions(solutions) {
            const solutionCards = solutions.map(solution => `
                <div class="solution-card">
                    <div class="solution-icon">
                        <svg viewBox="0 0 64 64" fill="currentColor">
                            <path d="M32 8l-4 8h-8l-4 8v8l-8 4v8l8 4v8l4 8h8l4 8 4-8h8l4-8v-8l8-4v-8l-8-4v-8l-4-8h-8z"/>
                        </svg>
                    </div>
                    <h3>${this.escapeHtml(solution.title)}</h3>
                </div>`).join('');

            return `    <!-- Solutions Section -->
    <section id="solutions" class="solutions-section">
        <div class="container">
            <h2>Our Solutions</h2>

            <div class="solutions-grid">
                ${solutionCards}
            </div>
        </div>
    </section>`;
        },

        /**
         * Generate projects section
         */
        generateProjects(projects) {
            const projectCards = projects.map(project => `
                <div class="project-card">
                    <img src="${project.image}" alt="${this.escapeHtml(project.title)}">
                    <div class="project-info">
                        <h3>${this.escapeHtml(project.title)}</h3>
                    </div>
                </div>`).join('');

            return `    <!-- Projects Section -->
    <section id="projects" class="projects-section">
        <div class="container">
            <h2>Our Projects</h2>

            <div class="projects-grid">
                ${projectCards}
            </div>
        </div>
    </section>`;
        },

        /**
         * Generate CTA section
         */
        generateCTA(cta) {
            return `    <!-- CTA Section -->
    <section class="cta-section">
        <div class="cta-overlay"></div>
        <img src="${cta.backgroundImage}" alt="Build the Future" class="cta-bg">
        <div class="container">
            <div class="cta-content">
                <h2>${this.escapeHtml(cta.title)} <span class="highlight">${this.escapeHtml(cta.highlightText)}</span></h2>
                <a href="${cta.buttonHref}" class="btn btn-large">${this.escapeHtml(cta.buttonText)}</a>
            </div>
        </div>
    </section>`;
        },

        /**
         * Generate footer
         */
        generateFooter(branding, footer) {
            const solutionsLinks = footer.solutionsLinks.map(link =>
                `<li><a href="#">${this.escapeHtml(link)}</a></li>`
            ).join('\n                        ');

            const projectsLinks = footer.projectsLinks.map(link =>
                `<li><a href="#">${this.escapeHtml(link)}</a></li>`
            ).join('\n                        ');

            return `    <!-- Footer -->
    <footer class="footer">
        <div class="container">
            <div class="footer-content">
                <div class="footer-section">
                    <h3>${this.escapeHtml(branding.companyName)}</h3>
                    <p>${this.escapeHtml(footer.description)}</p>
                </div>
                <div class="footer-section">
                    <h4>Solutions</h4>
                    <ul>
                        ${solutionsLinks}
                    </ul>
                </div>
                <div class="footer-section">
                    <h4>Projects</h4>
                    <ul>
                        ${projectsLinks}
                    </ul>
                </div>
                <div class="footer-section">
                    <h4>Contact</h4>
                    <ul>
                        <li>Email: ${this.escapeHtml(footer.contact.email)}</li>
                        <li>Phone: ${this.escapeHtml(footer.contact.phone)}</li>
                        <li>Address: ${this.escapeHtml(footer.contact.address)}</li>
                    </ul>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; ${new Date().getFullYear()} ${this.escapeHtml(branding.companyName)}. All rights reserved.</p>
            </div>
        </div>
    </footer>`;
        },

        /**
         * Get CSS for this template
         */
        async getCSS() {
            try {
                const response = await fetch('/templates/aimachine/styles.css');
                if (response.ok) {
                    return await response.text();
                }
            } catch (error) {
                console.warn('Could not load aimachine styles.css');
            }
            return '';
        },

        /**
         * Generate admin panel HTML for this template
         */
        generateAdminPanel(settings) {
            return `
<div class="template-admin aimachine-admin">
    <h3>AImachine Template Settings</h3>
    <p>Use the admin panel to customize your professional website.</p>
</div>
            `.trim();
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
        window.TemplateRegistry.register('aimachine', AImachineTemplate);
    }

    // Export for Node.js if needed
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = AImachineTemplate;
    }
})();
