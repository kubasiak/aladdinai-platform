const {onRequest} = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

admin.initializeApp();

// Serve static page from Storage (2nd gen function)
exports.servePage = onRequest({
    region: 'us-central1',
    memory: '256MiB'
}, async (req, res) => {
    try {
        // Get slug from URL path (empty string for root page)
        let slug = req.path.split('/').filter(p => p)[0] || '';

        // Use 'index' as filename for root page
        const filename = slug === '' ? 'index' : slug;

        console.log('Serving page for slug:', slug || '(root)', 'filename:', filename);

        // Get HTML from Storage
        const bucket = admin.storage().bucket();
        const file = bucket.file(`public-pages/${filename}.html`);

        // Check if file exists
        const [exists] = await file.exists();
        if (!exists) {
            res.status(404).send(`
                <html>
                <head><title>Page Not Found</title></head>
                <body style="font-family: Arial; text-align: center; padding: 50px;">
                    <h1>404 - Page Not Found</h1>
                    <p>No page found for: ${slug}</p>
                </body>
                </html>
            `);
            return;
        }

        // Download and serve the HTML
        const [content] = await file.download();

        res.set('Content-Type', 'text/html');
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate'); // No caching for instant updates
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
        res.status(200).send(content);

    } catch (error) {
        console.error('Error serving page:', error);
        res.status(500).send('Internal server error');
    }
});
