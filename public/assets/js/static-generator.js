// Static Site Generator
// Generates static HTML from customer settings for fast page loads

function generateStaticHTML(settings, customerId) {
    // Get media URLs (no fallback - user must upload their own media)
    const videoUrl = settings.selectedVideoUrl || '';
    const audioUrl = settings.selectedAudioUrl || '';
    const cardBg = settings.cardBackground || 'none';

    // Base URL for absolute paths (so resources load correctly from Storage)
    const baseUrl = 'https://ai-webpages.web.app';

    // Generate overlay animation CSS
    const minOpacity = 1 - (settings.minTransparency / 100);
    const maxOpacity = 1 - (settings.maxTransparency / 100);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${settings.companyName} - ${settings.tagline}">
    <title>${settings.companyName}</title>
    <link rel="stylesheet" href="${baseUrl}/assets/css/styles.css">
    <style>
        .logo h1 {
            font-size: ${settings.titleSize}rem !important;
            color: ${settings.fontColor} !important;
        }
        .tagline, .about h2, .about-text, .contact-item h3 {
            color: ${settings.fontColor} !important;
        }
        .about-text {
            font-size: ${settings.bodySize}rem !important;
        }
        .card {
            background-image: url(${cardBg});
            background-size: cover;
            background-position: center;
        }
        .video-overlay {
            animation-duration: ${settings.animDuration}s !important;
        }
        @keyframes videoFade {
            0% { background: rgba(0, 0, 0, ${minOpacity}); }
            50% { background: rgba(0, 0, 0, ${maxOpacity}); }
            100% { background: rgba(0, 0, 0, ${minOpacity}); }
        }
    </style>
</head>
<body>
    <div class="video-background">
        <video autoplay muted loop playsinline id="bgVideo">
            <source src="${videoUrl}" type="video/mp4">
        </video>
        <div class="video-overlay"></div>
    </div>
    <div class="container">
        <div class="card">
            <header class="hero">
                <div class="logo">
                    <h1>${settings.companyName}</h1>
                </div>
                <p class="tagline">${settings.tagline}</p>
            </header>
            <section class="about">
                <h2>${settings.aboutTitle}</h2>
                <p class="about-text">${settings.aboutText1}</p>
                <p class="about-text">${settings.aboutText2}</p>
            </section>
            <section class="contact">
                <div class="contact-grid">
                    <div class="contact-item">
                        <div class="contact-icon">📧</div>
                        <h3>Email</h3>
                        <a href="mailto:${settings.contactEmail}">${settings.contactEmail}</a>
                    </div>
                    <div class="contact-item">
                        <div class="contact-icon">📱</div>
                        <h3>Phone</h3>
                        <a href="tel:${settings.contactPhone.replace(/\s/g, '')}">${settings.contactPhone}</a>
                    </div>
                    <div class="contact-item">
                        <div class="contact-icon">📍</div>
                        <h3>Office</h3>
                        <p>${settings.contactAddress}</p>
                    </div>
                </div>
            </section>
            <footer>
                <p>&copy; 2026 ${settings.companyName}. All rights reserved.</p>
            </footer>
        </div>
    </div>
    ${audioUrl ? `<script>
        document.addEventListener('click', function() {
            const audio = new Audio('${audioUrl}');
            audio.loop = true;
            audio.volume = 0.3;
            audio.play().catch(e => console.log('Audio play failed'));
        }, { once: true });
    </script>` : ''}
    <script>
        const video = document.getElementById('bgVideo');
        if (video) video.playbackRate = ${settings.videoSpeed / 100};
    </script>
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>
    <script src="${baseUrl}/firebase-config.js"></script>
    <script>
        (async function() {
            try {
                const hourKey = new Date().toISOString().slice(0, 13).replace('T', '-');
                const dayKey = new Date().toISOString().slice(0, 10);
                await db.collection('bandwidth-tracking').doc('${customerId}')
                    .collection('hourly').doc(hourKey)
                    .set({ views: firebase.firestore.FieldValue.increment(1) }, { merge: true });
                await db.collection('bandwidth-tracking').doc('${customerId}')
                    .collection('daily').doc(dayKey)
                    .set({ views: firebase.firestore.FieldValue.increment(1) }, { merge: true });
            } catch (e) { }
        })();
    </script>
</body>
</html>`;

    return html;
}

if (typeof window !== 'undefined') {
    window.generateStaticHTML = generateStaticHTML;
}
