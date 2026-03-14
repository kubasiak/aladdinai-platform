// List all customer pages
const admin = require('firebase-admin');

// Initialize with application default credentials
admin.initializeApp({
    projectId: 'ai-webpages'
});

const db = admin.firestore();

async function listPages() {
    try {
        const snapshot = await db.collection('customers').get();

        console.log('\n=== All Customer Pages ===\n');

        const pages = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            const slug = data.slug || data.settings?.slug || 'not-set';
            const email = data.email || 'Unknown';
            const templateType = data.settings?.templateType || data.templateType || 'none';

            if (slug && slug !== 'not-set') {
                const url = `https://ai-webpages.web.app/${slug}`;
                pages.push({ email, slug, url, templateType });
            }
        });

        // Sort by slug
        pages.sort((a, b) => a.slug.localeCompare(b.slug));

        if (pages.length === 0) {
            console.log('No pages found with configured slugs.\n');
        } else {
            pages.forEach((page, index) => {
                console.log(`${index + 1}. ${page.email}`);
                console.log(`   URL: ${page.url}`);
                console.log(`   Template: ${page.templateType}`);
                console.log('');
            });

            console.log(`Total: ${pages.length} page(s)\n`);
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

listPages();
