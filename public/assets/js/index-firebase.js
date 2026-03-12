// Public Page - Firebase-enabled
// Loads settings and media from Firestore (no authentication required)

// Configuration: Set your customer ID here
// After you create your admin user, paste their UID here
const CUSTOMER_ID = 'YOUR_CUSTOMER_ID_HERE'; // Replace with actual customer UID from Firebase Auth

let backgroundAudio = null;

// Initialize and load content
document.addEventListener('DOMContentLoaded', async function() {
    const video = document.getElementById('bgVideo');

    // Check if customer ID is configured
    if (CUSTOMER_ID === 'YOUR_CUSTOMER_ID_HERE') {
        console.warn('⚠️ Customer ID not configured. Please set CUSTOMER_ID in index-firebase.js');
        console.log('📝 Steps to configure:');
        console.log('1. Create admin user in Firebase Auth');
        console.log('2. Copy their UID');
        console.log('3. Paste it into CUSTOMER_ID in assets/js/index-firebase.js');
        return;
    }

    try {
        // Load settings from Firestore (public read access)
        const doc = await db.collection('customers').doc(CUSTOMER_ID).get();

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
            await loadSelectedVideo(settings.selectedVideoId);
        }

        // Load and play selected audio if specified
        if (settings.selectedAudioId && settings.selectedAudioId !== 'none') {
            await loadSelectedAudio(settings.selectedAudioId);
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
async function loadSelectedVideo(videoId) {
    try {
        const doc = await db.collection('customers').doc(CUSTOMER_ID)
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
async function loadSelectedAudio(audioId) {
    try {
        const doc = await db.collection('customers').doc(CUSTOMER_ID)
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
console.log('📍 Customer ID:', CUSTOMER_ID);
