// Public Page - Firebase-enabled
// Loads settings and media from Firestore (no authentication required)

let backgroundAudio = null;

// Get customer ID from URL path or query parameter
function getCustomerIdentifier() {
    // Get slug from URL path (e.g., /aladdinai)
    const pathParts = window.location.pathname.split('/').filter(p => p);
    const slug = pathParts[0];

    // If no slug or index.html, use empty string to indicate root
    if (!slug || slug === 'index.html') {
        return ''; // Empty string = root page
    }

    return slug;
}

// Find customer by slug
async function findCustomerBySlug(slug) {
    try {
        const snapshot = await db.collection('customers')
            .where('settings.slug', '==', slug)
            .limit(1)
            .get();

        if (snapshot.empty) {
            console.log('No customer found with slug:', slug);
            return null;
        }

        return snapshot.docs[0].id;
    } catch (error) {
        console.error('Error finding customer:', error);
        return null;
    }
}

// Initialize and load content
document.addEventListener('DOMContentLoaded', async function() {
    const video = document.getElementById('bgVideo');

    // Get slug from URL
    const slug = getCustomerIdentifier();

    let customerId;

    if (slug === '') {
        // Root page - find customer with empty slug or first customer
        console.log('🔍 Loading root page - finding customer with empty/no slug');
        const snapshot = await db.collection('customers')
            .where('settings.slug', 'in', ['', null])
            .limit(1)
            .get();

        if (!snapshot.empty) {
            customerId = snapshot.docs[0].id;
        } else {
            // No customer with empty slug, try getting the first customer
            const firstCustomer = await db.collection('customers').limit(1).get();
            if (!firstCustomer.empty) {
                customerId = firstCustomer.docs[0].id;
            }
        }
    } else {
        console.log('🔍 Looking up customer for slug:', slug);
        customerId = await findCustomerBySlug(slug);
    }

    if (!customerId) {
        console.error('❌ No customer found');
        document.body.innerHTML = '<div style="padding: 50px; text-align: center;"><h1>Page Not Found</h1><p>No customer page found</p></div>';
        return;
    }

    console.log('✅ Found customer:', customerId);

    try {
        // Load settings from Firestore (public read access)
        const doc = await db.collection('customers').doc(customerId).get();

        if (!doc.exists || !doc.data().settings) {
            console.log('No settings found for customer. Using defaults.');
            return;
        }

        const settings = doc.data().settings;
        console.log('✅ Loaded settings from Firestore:', settings);

        // Apply settings to page
        await applySettings(settings);

        // Load and play selected video if specified
        if (settings.selectedVideoId && settings.selectedVideoId !== 'none') {
            await loadSelectedVideo(settings.selectedVideoId, customerId);
        }

        // Load and play selected audio if specified
        if (settings.selectedAudioId && settings.selectedAudioId !== 'none') {
            await loadSelectedAudio(settings.selectedAudioId, customerId);
        }

        // Play video
        if (video) {
            video.play().catch(error => console.log('Video autoplay failed:', error));
        }

    } catch (error) {
        console.error('Error loading content:', error);
    }
});

// Apply settings to page elements
async function applySettings(settings) {
    // Update text content
    const fields = [
        'companyName', 'tagline', 'aboutTitle',
        'aboutText1', 'aboutText2', 'contactEmail',
        'contactPhone', 'contactAddress'
    ];

    fields.forEach(field => {
        const element = document.querySelector(`[data-field="${field}"]`);
        if (element && settings[field]) {
            if (field === 'contactAddress') {
                element.innerHTML = settings[field];
            } else {
                element.textContent = settings[field];
            }

            // Update href for links
            if (field === 'contactEmail' && element.tagName === 'A') {
                element.href = 'mailto:' + settings[field];
            } else if (field === 'contactPhone' && element.tagName === 'A') {
                element.href = 'tel:' + settings[field].replace(/\s/g, '');
            }
        }
    });

    // Apply visual settings
    if (settings.titleSize) {
        const titleEl = document.querySelector('[data-field="companyName"]');
        if (titleEl) titleEl.style.fontSize = settings.titleSize + 'rem';
    }

    if (settings.bodySize) {
        document.querySelectorAll('.about-text').forEach(el => {
            el.style.fontSize = settings.bodySize + 'rem';
        });
    }

    if (settings.fontColor) {
        applyFontColor(settings.fontColor);
    }

    if (settings.minTransparency !== undefined && settings.maxTransparency !== undefined && settings.animDuration) {
        updateOverlayAnimation(settings.minTransparency, settings.maxTransparency, settings.animDuration);
    }

    if (settings.videoSpeed) {
        applyVideoSpeed(settings.videoSpeed);
    }

    if (settings.cardBackground) {
        const card = document.querySelector('.card');
        if (card) {
            card.style.backgroundImage = `url(${settings.cardBackground})`;
            card.style.backgroundSize = 'cover';
            card.style.backgroundPosition = 'center';
        }
    }
}

// Load selected video from Firestore
async function loadSelectedVideo(videoId, customerId) {
    try {
        const doc = await db.collection('customers').doc(customerId)
            .collection('videos').doc(videoId).get();

        if (doc.exists) {
            const videoData = doc.data();
            const video = document.getElementById('bgVideo');
            if (video && videoData.url) {
                const source = video.querySelector('source');
                if (source) {
                    source.src = videoData.url;
                    video.load();
                }
                console.log('✅ Loaded video from Firestore:', videoData.name);
            }
        }
    } catch (error) {
        console.error('Error loading video:', error);
    }
}

// Load selected audio from Firestore
async function loadSelectedAudio(audioId, customerId) {
    try {
        const doc = await db.collection('customers').doc(customerId)
            .collection('audio').doc(audioId).get();

        if (doc.exists) {
            const audioData = doc.data();
            if (audioData.url) {
                backgroundAudio = new Audio(audioData.url);
                backgroundAudio.loop = true;
                backgroundAudio.volume = 0.3;
                backgroundAudio.play().catch(error => console.log('Audio autoplay failed:', error));
                console.log('✅ Loaded audio from Firestore:', audioData.name);
            }
        }
    } catch (error) {
        console.error('Error loading audio:', error);
    }
}

// Apply font color
function applyFontColor(color) {
    const styleEl = document.createElement('style');
    styleEl.textContent = `
        .logo h1,
        .tagline,
        .about h2,
        .about-text,
        .contact-item h3 {
            color: ${color} !important;
        }
    `;
    document.head.appendChild(styleEl);
}

// Update overlay animation
function updateOverlayAnimation(minTransparency, maxTransparency, duration) {
    const minOpacity = 1 - (minTransparency / 100);
    const maxOpacity = 1 - (maxTransparency / 100);

    const styleEl = document.createElement('style');
    styleEl.textContent = `
        .video-overlay {
            animation-duration: ${duration}s !important;
        }
        @keyframes videoFade {
            0% { background: rgba(0, 0, 0, ${minOpacity}); }
            50% { background: rgba(0, 0, 0, ${maxOpacity}); }
            100% { background: rgba(0, 0, 0, ${minOpacity}); }
        }
    `;
    document.head.appendChild(styleEl);
}

// Apply video playback speed
function applyVideoSpeed(speed) {
    const video = document.getElementById('bgVideo');
    if (video) {
        video.playbackRate = speed / 100;
    }
}

console.log('✅ Public page Firebase integration loaded');
