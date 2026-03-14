const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Serve static page from Storage
exports.servePage = functions.https.onRequest(async (req, res) => {
    try {
        // Get slug from URL path
        const slug = req.path.split('/')[1] || req.query.slug;

        if (!slug) {
            res.status(400).send('No slug provided');
            return;
        }

        console.log('Serving page for slug:', slug);

        // Get HTML from Storage
        const bucket = admin.storage().bucket();
        const file = bucket.file(`public-pages/${slug}.html`);

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
        res.set('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes
        res.status(200).send(content);

    } catch (error) {
        console.error('Error serving page:', error);
        res.status(500).send('Internal server error');
    }
});
