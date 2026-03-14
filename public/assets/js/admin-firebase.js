// Admin Firebase-Enabled JavaScript
// Uses Firebase Auth, Firestore, and Storage for persistence

const MAX_VIDEO_SIZE = 15 * 1024 * 1024; // 15MB
const MAX_AUDIO_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_LIBRARY_SIZE = 100 * 1024 * 1024; // 100MB total

let currentUser = null;
let customerId = null;

// Adapter: Maps old IndexedDB interface to Firebase interface
const MediaStorage = {
    // Initialize Firebase storage with customer ID
    async init() {
        if (!customerId) {
            throw new Error('Customer ID not set. User must be authenticated first.');
        }
        return await FirebaseMediaStorage.init(customerId);
    },

    // Save video (Firebase)
    async saveVideo(videoData) {
        return await FirebaseMediaStorage.saveVideo(videoData);
    },

    // Save audio (Firebase)
    async saveAudio(audioData) {
        return await FirebaseMediaStorage.saveAudio(audioData);
    },

    // Save screenshot (Firebase)
    async saveScreenshot(screenshotData) {
        return await FirebaseMediaStorage.saveScreenshot(screenshotData);
    },

    // Get all items - adapter to Firebase methods
    async getAll(storeName) {
        if (storeName === 'videos') {
            return await FirebaseMediaStorage.getAllVideos();
        } else if (storeName === 'audio') {
            return await FirebaseMediaStorage.getAllAudio();
        } else if (storeName === 'screenshots') {
            return await FirebaseMediaStorage.getAllScreenshots();
        }
        return [];
    },

    // Delete item (Firebase)
    async delete(storeName, id) {
        return await FirebaseMediaStorage.delete(storeName, id);
    }
};

// Load media library from Firestore
async function loadMediaLibrary() {
    try {
        return {
            videos: await MediaStorage.getAll('videos'),
            audio: await MediaStorage.getAll('audio'),
            screenshots: await MediaStorage.getAll('screenshots')
        };
    } catch (error) {
        console.error('Error loading media library:', error);
        return { videos: [], audio: [], screenshots: [] };
    }
}

// Display current template in UI
function displayCurrentTemplate(templateType) {
    const currentTemplateEl = document.getElementById('currentTemplate');
    if (!currentTemplateEl) return;

    try {
        const template = window.TemplateRegistry.get(templateType);
        currentTemplateEl.textContent = template.name;
        currentTemplateEl.style.color = '#ffffff';
        currentTemplateEl.style.fontWeight = '600';
    } catch (error) {
        currentTemplateEl.textContent = templateType;
        console.error('Could not get template info:', error);
    }
}

// Run template system migration if needed
async function runTemplateMigration() {
    try {
        const settings = await FirebaseMediaStorage.getSettings();

        // Check if migration is needed
        if (window.TemplateMigration && window.TemplateMigration.needsMigration(settings)) {
            console.log('🔄 Running template system migration...');

            const migratedSettings = await window.TemplateMigration.autoMigrate(
                settings,
                async (newSettings) => {
                    await FirebaseMediaStorage.saveSettings(newSettings);
                }
            );

            console.log('✅ Template migration complete');
            return migratedSettings;
        } else {
            console.log('✓ Settings already on template system (or migration not loaded)');
            return settings;
        }
    } catch (error) {
        console.error('Error during migration:', error);
        // Continue anyway - migration is not critical
        return null;
    }
}

let mediaLibrary = { videos: [], audio: [], screenshots: [] };
let backgroundAudio = null;

// Helper: Update a specific setting field in Firestore
async function updateSetting(key, value) {
    try {
        const settings = await FirebaseMediaStorage.getSettings();
        settings[key] = value;
        await FirebaseMediaStorage.saveSettings(settings);
    } catch (error) {
        console.error('Error updating setting:', error);
    }
}

// DOM Elements
const loginModal = document.getElementById('loginModal');
const loginForm = document.getElementById('loginForm');
const adminPassword = document.getElementById('adminPassword');
const adminControls = document.getElementById('adminControls');
const video = document.getElementById('bgVideo');

// Initialize with Firebase Auth
document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            // Not logged in - redirect to login page
            console.log('Not authenticated, redirecting to login...');
            window.location.href = 'login.html';
            return;
        }

        // User is authenticated
        currentUser = user;
        customerId = user.uid;
        console.log('✅ Authenticated as:', user.email, 'Customer ID:', customerId);

        // Display user info in header
        const userInfo = document.getElementById('userInfo');
        if (userInfo) {
            userInfo.textContent = `👤 ${user.email}`;
        }

        try {
            // Initialize Firebase storage with customer ID
            await MediaStorage.init();
            mediaLibrary = await loadMediaLibrary();

            // Initialize admin interface
            initializeAdmin();
        } catch (error) {
            console.error('Failed to initialize admin:', error);
            alert('Error initializing admin panel: ' + error.message);
        }
    });
});

// Populate media dropdowns
// Initialize admin controls
async function initializeAdmin() {
    // Get current settings
    const settings = await FirebaseMediaStorage.getSettings();

    // Check if this is a brand new user (no settings at all in Firestore)
    const customerId = currentUser.uid;
    const doc = await db.collection('customers').doc(customerId).get();
    const isNewUser = !doc.exists || !doc.data().settings;

    // New users should select a template first
    if (isNewUser) {
        console.log('New user - redirecting to template selector...');
        window.location.href = 'template-selector.html';
        return;
    }

    // Existing users without templateType need migration
    if (!settings.templateType) {
        console.log('Existing user without template - running migration...');
        await runTemplateMigration();
        // Reload settings after migration
        const migratedSettings = await FirebaseMediaStorage.getSettings();
        displayCurrentTemplate(migratedSettings.templateType);
    } else {
        // User already has template selected
        displayCurrentTemplate(settings.templateType);
    }

    await loadSavedSettings();
    setupLiveControls();
    setupEditableFields();
    renderMediaLibrary();
    await renderScreenshotLibrary();
    updateLibraryStats();

    // Load selected video and audio from settings
    let currentSettings;
    try {
        currentSettings = await FirebaseMediaStorage.getSettings();
    } catch (error) {
        currentSettings = {};
    }

    // Load selected video if one is saved
    if (currentSettings.selectedVideoId) {
        const selectedVideo = mediaLibrary.videos.find(v => v.id === currentSettings.selectedVideoId);
        if (selectedVideo) {
            await useVideo(selectedVideo);
            console.log('▶️ Loaded selected video:', selectedVideo.name);
        }
    }

    // Load selected audio if one is saved
    if (currentSettings.selectedAudioId) {
        const selectedAudio = mediaLibrary.audio.find(a => a.id === currentSettings.selectedAudioId);
        if (selectedAudio) {
            await useAudio(selectedAudio);
            console.log('🔊 Loaded selected audio:', selectedAudio.name);
        }
    }
}

// Progress bar helpers
function showProgress(text, percent) {
    const container = document.getElementById('progressContainer');
    const progressText = document.getElementById('progressText');
    const progressBar = document.getElementById('progressBar');

    container.style.display = 'block';
    progressText.textContent = text;
    progressBar.style.width = percent + '%';
}

function hideProgress() {
    const container = document.getElementById('progressContainer');
    setTimeout(() => {
        container.style.display = 'none';
    }, 1000);
}

// Upload trigger functions
window.triggerVideoUpload = function() {
    document.getElementById('videoUpload').click();
};

window.triggerAudioUpload = function() {
    document.getElementById('audioUpload').click();
};

// Setup live controls
function setupLiveControls() {
    // Toggle controls panel
    document.getElementById('toggleControls').addEventListener('click', function() {
        adminControls.classList.toggle('collapsed');
    });

    // Title size slider
    const titleSlider = document.getElementById('titleSizeSlider');
    const titleVal = document.getElementById('titleSizeVal');
    titleSlider.addEventListener('input', function() {
        titleVal.textContent = this.value;
        document.querySelector('.logo h1').style.fontSize = this.value + 'rem';
    });

    // Body size slider
    const bodySlider = document.getElementById('bodySizeSlider');
    const bodyVal = document.getElementById('bodySizeVal');
    bodySlider.addEventListener('input', function() {
        bodyVal.textContent = this.value;
        document.querySelectorAll('.about-text').forEach(el => {
            el.style.fontSize = this.value + 'rem';
        });
    });

    // Min Transparency slider
    const minTransparencySlider = document.getElementById('minTransparencySlider');
    const minTransparencyVal = document.getElementById('minTransparencyVal');
    minTransparencySlider.addEventListener('input', function() {
        minTransparencyVal.textContent = this.value;
        updateOverlayAnimation(minTransparencySlider.value, maxTransparencySlider.value, animSpeedSlider.value);
    });

    // Max Transparency slider
    const maxTransparencySlider = document.getElementById('maxTransparencySlider');
    const maxTransparencyVal = document.getElementById('maxTransparencyVal');
    maxTransparencySlider.addEventListener('input', function() {
        maxTransparencyVal.textContent = this.value;
        updateOverlayAnimation(minTransparencySlider.value, maxTransparencySlider.value, animSpeedSlider.value);
    });

    // Animation speed slider
    const animSpeedSlider = document.getElementById('animSpeedSlider');
    const animSpeedVal = document.getElementById('animSpeedVal');
    animSpeedSlider.addEventListener('input', function() {
        animSpeedVal.textContent = this.value;
        updateOverlayAnimation(minTransparencySlider.value, maxTransparencySlider.value, this.value);
    });

    // Font color picker
    const fontColorPicker = document.getElementById('fontColorPicker');
    fontColorPicker.addEventListener('input', function() {
        applyFontColor(this.value);
    });

    // Slug input handling
    const slugInput = document.getElementById('slugInput');
    const publicUrlPreview = document.getElementById('publicUrlPreview');
    if (slugInput && publicUrlPreview) {
        slugInput.addEventListener('input', function() {
            let slug = slugInput.value
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9-]/g, '');
            slugInput.value = slug;
            publicUrlPreview.textContent = `https://ai-webpages.web.app/${slug || 'your-slug'}`;
        });
    }

    // Video upload handler
    const videoUpload = document.getElementById('videoUpload');
    videoUpload.addEventListener('change', function(e) {
        if (e.target.files[0]) {
            handleVideoUpload(e.target.files[0]);
        }
        this.value = ''; // Reset input
    });

    // Audio upload handler
    const audioUpload = document.getElementById('audioUpload');
    audioUpload.addEventListener('change', function(e) {
        if (e.target.files[0]) {
            handleAudioUpload(e.target.files[0]);
        }
        this.value = ''; // Reset input
    });

    // Video speed slider
    const videoSpeedSlider = document.getElementById('videoSpeedSlider');
    const videoSpeedVal = document.getElementById('videoSpeedVal');
    videoSpeedSlider.addEventListener('input', function() {
        videoSpeedVal.textContent = this.value;
        applyVideoSpeed(this.value);
    });

    // Save button
    document.getElementById('saveBtn').addEventListener('click', saveAllSettings);

    // Reset button
    document.getElementById('resetBtn').addEventListener('click', async function() {
        if (confirm('🔄 Reset all changes to defaults?')) {
            try {
                const defaults = FirebaseMediaStorage.getDefaultSettings();
                await FirebaseMediaStorage.saveSettings(defaults);
                location.reload();
            } catch (error) {
                console.error('Error resetting:', error);
                alert('Error resetting settings');
            }
        }
    });

    // Exit button
    document.getElementById('exitBtn').addEventListener('click', async function() {
        try {
            // Get the slug from settings
            const settings = await FirebaseMediaStorage.getSettings();
            const slug = settings.slug || '';

            await auth.signOut();
            // Redirect to root if slug is empty, otherwise to /{slug}
            window.location.href = slug === '' ? '/' : `/${slug}`;
        } catch (error) {
            console.error('Error signing out:', error);
            await auth.signOut();
            window.location.href = '/';
        }
    });
}

// Setup editable fields
function setupEditableFields() {
    // Prevent line breaks in single-line fields
    document.querySelectorAll('[contenteditable="true"]').forEach(el => {
        if (!el.classList.contains('about-text') && el.tagName !== 'P') {
            el.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                }
            });
        }

        // Update href for links
        if (el.tagName === 'A') {
            el.addEventListener('blur', function() {
                const field = this.dataset.field;
                if (field === 'contactEmail') {
                    this.href = 'mailto:' + this.textContent;
                } else if (field === 'contactPhone') {
                    this.href = 'tel:' + this.textContent.replace(/\s/g, '');
                }
            });
        }
    });
}

// Update overlay animation
function updateOverlayAnimation(minTransparency, maxTransparency, duration) {
    const minOpacity = 1 - (minTransparency / 100); // Darkest (start/end)
    const maxOpacity = 1 - (maxTransparency / 100); // Lightest (middle)

    let styleEl = document.getElementById('admin-overlay-style');
    if (styleEl) {
        styleEl.remove();
    }

    styleEl = document.createElement('style');
    styleEl.id = 'admin-overlay-style';
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

// Apply font color
function applyFontColor(color) {
    let styleEl = document.getElementById('admin-font-style');
    if (styleEl) {
        styleEl.remove();
    }

    styleEl = document.createElement('style');
    styleEl.id = 'admin-font-style';
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

// Validate file
function validateFile(file, maxSize, allowedTypes) {
    // Check size
    if (file.size > maxSize) {
        const maxMB = (maxSize / 1024 / 1024).toFixed(1);
        alert(`❌ File too large! Maximum size: ${maxMB}MB\nYour file: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
        return false;
    }

    // Check type
    if (!allowedTypes.includes(file.type)) {
        alert(`❌ Invalid file format!\nAllowed: ${allowedTypes.join(', ')}`);
        return false;
    }

    // Check total library size
    const currentSize = getTotalLibrarySize();
    if (currentSize + file.size > MAX_LIBRARY_SIZE) {
        alert(`❌ Library full! Delete some files first.\nCurrent: ${(currentSize / 1024 / 1024).toFixed(1)}MB\nMax: ${(MAX_LIBRARY_SIZE / 1024 / 1024)}MB`);
        return false;
    }

    return true;
}

// Generate screenshot from video
function generateScreenshotFromVideo(videoData, callback) {
    console.log('📸 Generating screenshot from video...');

    // Create a temporary video element
    const tempVideo = document.createElement('video');
    tempVideo.muted = true; // Mute to avoid audio issues
    tempVideo.playsInline = true;
    tempVideo.src = videoData.data;

    tempVideo.addEventListener('loadeddata', function() {
        console.log('Video loaded, duration:', tempVideo.duration);
        // Wait a bit then seek to 3.5 seconds (middle of video)
        const seekTime = Math.min(3.5, tempVideo.duration / 2);
        console.log('Seeking to:', seekTime);
        tempVideo.currentTime = seekTime;
    });

    tempVideo.addEventListener('seeked', function() {
        try {
            console.log('Seeked! Capturing frame...');

            // Create canvas
            const canvas = document.createElement('canvas');
            canvas.width = tempVideo.videoWidth || 1280;
            canvas.height = tempVideo.videoHeight || 720;

            console.log('Canvas size:', canvas.width, 'x', canvas.height);

            const ctx = canvas.getContext('2d');
            ctx.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);

            // Convert to base64
            const screenshotData = canvas.toDataURL('image/jpeg', 0.85);

            console.log('✅ Screenshot generated, size:', (screenshotData.length / 1024).toFixed(2), 'KB');

            // Clean up
            tempVideo.src = '';
            tempVideo.remove();

            callback(screenshotData);
        } catch (error) {
            console.error('❌ Error generating screenshot:', error);
            tempVideo.remove();
        }
    });

    tempVideo.addEventListener('error', function(e) {
        console.error('❌ Video loading error:', e);
        tempVideo.remove();
    });

    tempVideo.load();
}

// Handle video upload
async function handleVideoUpload(file) {
    if (!file) return;

    const allowedTypes = ['video/mp4', 'video/webm'];
    if (!validateFile(file, MAX_VIDEO_SIZE, allowedTypes)) return;

    showProgress(`Uploading ${file.name}...`, 10);

    const reader = new FileReader();
    reader.onload = async function(e) {
        showProgress(`Processing ${file.name}...`, 30);

        const videoData = {
            name: file.name,
            size: file.size,
            type: file.type,
            data: e.target.result,
            timestamp: Date.now()
        };

        try {
            showProgress('Saving video...', 50);
            const videoId = await MediaStorage.saveVideo(videoData);
            videoData.id = videoId;

            showProgress('Reloading library...', 70);
            mediaLibrary = await loadMediaLibrary();

            // Use the video
            const video = document.getElementById('bgVideo');
            if (video) video.style.opacity = '1';
            useVideo(videoData);

            showProgress('Generating screenshot...', 80);
            // Generate screenshot
            generateScreenshotFromVideo(videoData, async function(screenshotData) {
                try {
                    const screenshotObj = {
                        name: file.name.replace(/\.[^/.]+$/, ''),
                        data: screenshotData,
                        videoName: file.name,
                        timestamp: Date.now()
                    };

                    await MediaStorage.saveScreenshot(screenshotObj);
                    mediaLibrary = await loadMediaLibrary();
                    await renderScreenshotLibrary();
                    console.log('✅ Screenshot generated');
                } catch (error) {
                    console.error('❌ Error saving screenshot:', error);
                }
            });

            showProgress('Finalizing...', 90);
            renderMediaLibrary();
            updateLibraryStats();

            showProgress('✅ Upload complete!', 100);
            console.log('✅ Video uploaded:', file.name, (file.size / 1024 / 1024).toFixed(2) + ' MB');
            hideProgress();
        } catch (error) {
            console.error('❌ Error saving video:', error);
            showProgress('❌ Upload failed', 0);
            setTimeout(hideProgress, 2000);
        }
    };

    reader.onerror = function(error) {
        console.error('❌ Error reading video file:', error);
        showProgress('❌ Upload failed', 0);
        setTimeout(hideProgress, 2000);
    };

    reader.readAsDataURL(file);
}

// Handle audio upload
async function handleAudioUpload(file) {
    if (!file) return;

    const allowedTypes = ['audio/mp3', 'audio/mpeg', 'audio/ogg', 'audio/wav'];
    if (!validateFile(file, MAX_AUDIO_SIZE, allowedTypes)) return;

    showProgress(`Uploading ${file.name}...`, 20);

    const reader = new FileReader();
    reader.onload = async function(e) {
        showProgress(`Processing ${file.name}...`, 40);

        const audioData = {
            name: file.name,
            size: file.size,
            type: file.type,
            data: e.target.result,
            timestamp: Date.now()
        };

        try {
            showProgress('Saving audio...', 60);
            const audioId = await MediaStorage.saveAudio(audioData);
            audioData.id = audioId;

            showProgress('Reloading library...', 80);
            mediaLibrary = await loadMediaLibrary();

            // Use the audio
            useAudio(audioData);

            renderMediaLibrary();
            updateLibraryStats();

            showProgress('✅ Upload complete!', 100);
            console.log('✅ Audio uploaded:', file.name, (file.size / 1024 / 1024).toFixed(2) + ' MB');
            hideProgress();
        } catch (error) {
            console.error('❌ Error saving audio:', error);
            showProgress('❌ Upload failed', 0);
            setTimeout(hideProgress, 2000);
        }
    };

    reader.onerror = function(error) {
        console.error('❌ Error reading audio file:', error);
        showProgress('❌ Upload failed', 0);
        setTimeout(hideProgress, 2000);
    };

    reader.readAsDataURL(file);
}

// Use video from library
async function useVideo(videoData) {
    const video = document.getElementById('bgVideo');
    const source = video.querySelector('source');
    source.src = videoData.url || videoData.data;

    // Set poster to card background (if one is selected)
    try {
        const settings = await FirebaseMediaStorage.getSettings();
        if (settings.cardBackground) {
            video.poster = settings.cardBackground;
            console.log('🖼️ Set video poster from card background');
        } else {
            // Fallback: try to find screenshot for this video
            const videoScreenshot = mediaLibrary.screenshots.find(s => s.videoName === videoData.name);
            if (videoScreenshot) {
                video.poster = videoScreenshot.url || videoScreenshot.data;
                console.log('🖼️ Set video poster from screenshot');
            }
        }
    } catch (error) {
        console.log('No poster available');
    }

    video.load();
    video.play();

    // Save selected video ID to Firestore for public page
    await updateSetting('selectedVideoId', videoData.id);

    // Re-render to show active state
    await renderMediaLibrary();

    console.log('▶️ Playing video:', videoData.name, (videoData.size / 1024 / 1024).toFixed(2) + ' MB');
}

// Use audio from library
async function useAudio(audioData) {
    // Stop current audio
    if (backgroundAudio) {
        backgroundAudio.pause();
        backgroundAudio = null;
    }

    // Create new audio
    backgroundAudio = new Audio(audioData.url || audioData.data);
    backgroundAudio.loop = true;
    backgroundAudio.volume = 0.3;
    backgroundAudio.play();

    // Save selected audio ID to Firestore for public page
    updateSetting('selectedAudioId', audioData.id);

    // Re-render to show active state
    await renderMediaLibrary();

    console.log('🔊 Playing audio:', audioData.name, (audioData.size / 1024 / 1024).toFixed(2) + ' MB');
}

// Delete from library
async function deleteFromLibrary(type, index) {
    try {
        if (type === 'video') {
            const videoToDelete = mediaLibrary.videos[index];

            // Delete the video
            await MediaStorage.delete('videos', videoToDelete.id);

            // Find and delete associated screenshots
            const associatedScreenshots = mediaLibrary.screenshots.filter(
                s => s.videoName === videoToDelete.name
            );

            if (associatedScreenshots.length > 0) {
                console.log(`🗑️ Deleting ${associatedScreenshots.length} associated screenshot(s)...`);
                for (const screenshot of associatedScreenshots) {
                    try {
                        await MediaStorage.delete('screenshots', screenshot.id);
                    } catch (error) {
                        console.error('Error deleting screenshot:', error);
                    }
                }
            }

            // Reload library
            mediaLibrary = await loadMediaLibrary();

            // If there are still videos, switch to the first one
            if (mediaLibrary.videos.length > 0) {
                useVideo(mediaLibrary.videos[0]);
            } else {
                // No videos left, clear the video source
                const video = document.getElementById('bgVideo');
                if (video) {
                    video.pause();
                    video.src = '';
                    video.load();
                }
            }

            // Re-render screenshot library
            await renderScreenshotLibrary();
        } else if (type === 'audio') {
            const audioToDelete = mediaLibrary.audio[index];
            await MediaStorage.delete('audio', audioToDelete.id);

            // Reload library
            mediaLibrary = await loadMediaLibrary();

            // Stop audio if it was playing
            if (backgroundAudio) {
                backgroundAudio.pause();
                backgroundAudio = null;
            }
        }

        await renderMediaLibrary();
        updateLibraryStats();

        console.log('✅ Deleted from library');
    } catch (error) {
        console.error('❌ Error deleting:', error);
    }
}

// Render screenshot library
async function renderScreenshotLibrary() {
    const screenshotLibrary = document.getElementById('screenshotLibrary');

    let currentSettings;
    try {
        currentSettings = await FirebaseMediaStorage.getSettings();
    } catch (error) {
        currentSettings = {};
    }

    const activeScreenshot = currentSettings?.cardBackground || '';

    if (!mediaLibrary.screenshots || mediaLibrary.screenshots.length === 0) {
        screenshotLibrary.innerHTML = '<div class="library-empty">No screenshots available</div>';
    } else {
        screenshotLibrary.innerHTML = mediaLibrary.screenshots.map((screenshot, index) => `
            <div class="screenshot-item ${screenshot.url === activeScreenshot || screenshot.data === activeScreenshot ? 'active' : ''}" onclick="useScreenshotFromLibrary(${index})">
                <img src="${screenshot.url || screenshot.data}" alt="${screenshot.name}">
                <div class="screenshot-item-overlay">
                    <div class="screenshot-item-name">${screenshot.name}</div>
                    <button class="library-btn delete" onclick="event.stopPropagation(); deleteScreenshot(${index});" style="position: absolute; top: 5px; right: 5px; z-index: 10;" title="Delete">🗑️</button>
                </div>
            </div>
        `).join('');
    }
}

// Delete screenshot
window.deleteScreenshot = async function(index) {
    try {
        const screenshot = mediaLibrary.screenshots[index];
        showProgress('Deleting screenshot...', 50);
        await MediaStorage.delete('screenshots', screenshot.id);
        mediaLibrary = await loadMediaLibrary();
        await renderScreenshotLibrary();
        hideProgress();
        console.log('✅ Screenshot deleted');
    } catch (error) {
        console.error('❌ Error deleting screenshot:', error);
        hideProgress();
    }
}

// Render media library
async function renderMediaLibrary() {
    // Get current settings to mark active items
    let currentSettings = {};
    try {
        currentSettings = await FirebaseMediaStorage.getSettings();
    } catch (error) {
        console.log('No settings found');
    }

    const activeVideoId = currentSettings.selectedVideoId;
    const activeAudioId = currentSettings.selectedAudioId;

    // Render videos
    const videoLibrary = document.getElementById('videoLibrary');

    const videoItems = [
        // NONE option
        `<div class="library-item" style="background: #f5f5f5; border: 2px ${activeVideoId === 'none' ? 'solid #4CAF50' : 'dashed #ccc'};">
            <div class="library-item-info">
                <div class="library-item-name">🚫 No Video</div>
                <div class="library-item-size">Disable background video</div>
            </div>
            <div class="library-item-actions">
                <button class="library-btn use" onclick="disableVideo()" title="Disable video">✓</button>
            </div>
        </div>`,
        // Regular videos
        ...mediaLibrary.videos.map((vid, index) => `
            <div class="library-item" style="border: 2px solid ${vid.id === activeVideoId ? '#4CAF50' : 'transparent'}; background: ${vid.id === activeVideoId ? '#e8f5e9' : 'white'};">
                <div class="library-item-info">
                    <div class="library-item-name">${vid.name}</div>
                    <div class="library-item-size">${(vid.size / 1024 / 1024).toFixed(2)} MB</div>
                </div>
                <div class="library-item-actions">
                    <button class="library-btn use" onclick="useVideoFromLibrary(${index})" title="Use">▶️</button>
                    <button class="library-btn delete" onclick="deleteVideoFromLibrary(${index})" title="Delete">🗑️</button>
                </div>
            </div>
        `)
    ];

    videoLibrary.innerHTML = videoItems.join('');

    // Render audio
    const audioLibrary = document.getElementById('audioLibrary');

    const audioItems = [
        // NONE option
        `<div class="library-item" style="background: #f5f5f5; border: 2px ${activeAudioId === 'none' ? 'solid #4CAF50' : 'dashed #ccc'};">
            <div class="library-item-info">
                <div class="library-item-name">🔇 No Audio</div>
                <div class="library-item-size">Disable background audio</div>
            </div>
            <div class="library-item-actions">
                <button class="library-btn use" onclick="disableAudio()" title="Disable audio">✓</button>
            </div>
        </div>`,
        // Regular audio
        ...mediaLibrary.audio.map((aud, index) => `
            <div class="library-item" style="border: 2px solid ${aud.id === activeAudioId ? '#4CAF50' : 'transparent'}; background: ${aud.id === activeAudioId ? '#e8f5e9' : 'white'};">
                <div class="library-item-info">
                    <div class="library-item-name">${aud.name}</div>
                    <div class="library-item-size">${(aud.size / 1024 / 1024).toFixed(2)} MB</div>
                </div>
                <div class="library-item-actions">
                    <button class="library-btn use" onclick="useAudioFromLibrary(${index})" title="Use">▶️</button>
                    <button class="library-btn delete" onclick="deleteAudioFromLibrary(${index})" title="Delete">🗑️</button>
                </div>
            </div>
        `)
    ];

    audioLibrary.innerHTML = audioItems.join('');
}

// Use screenshot from library
async function useScreenshot(screenshot) {
    // Apply to card background
    const card = document.querySelector('.card');
    if (card) {
        const imageUrl = screenshot.url || screenshot.data;
        card.style.backgroundImage = `url(${imageUrl})`;
        card.style.backgroundSize = 'cover';
        card.style.backgroundPosition = 'center';

        // Save to Firestore
        updateSetting('cardBackground', imageUrl);
    }

    // Re-render library to update active state
    await renderScreenshotLibrary();
}

// Disable video/audio functions
window.disableVideo = async function() {
    const video = document.getElementById('bgVideo');
    if (video) {
        video.pause();
        video.style.opacity = '0';
    }
    updateSetting('selectedVideoId', 'none');
    await renderMediaLibrary();
    console.log('🚫 Video disabled');
};

window.disableAudio = async function() {
    if (backgroundAudio) {
        backgroundAudio.pause();
        backgroundAudio = null;
    }
    updateSetting('selectedAudioId', 'none');
    await renderMediaLibrary();
    console.log('🔇 Audio disabled');
};

// Global functions for onclick handlers
window.useVideoFromLibrary = function(index) {
    const video = document.getElementById('bgVideo');
    if (video) video.style.opacity = '1';
    useVideo(mediaLibrary.videos[index]);
};

window.deleteVideoFromLibrary = async function(index) {
    showProgress('Deleting video...', 50);
    await deleteFromLibrary('video', index);
    hideProgress();
};

window.useAudioFromLibrary = function(index) {
    useAudio(mediaLibrary.audio[index]);
};

window.deleteAudioFromLibrary = async function(index) {
    showProgress('Deleting audio...', 50);
    await deleteFromLibrary('audio', index);
    hideProgress();
};

window.useScreenshotFromLibrary = function(index) {
    useScreenshot(mediaLibrary.screenshots[index]);
};


// Update library statistics
function updateLibraryStats() {
    const totalSize = getTotalLibrarySize();
    const sizeElement = document.getElementById('librarySize');
    if (sizeElement) {
        const sizeMB = (totalSize / 1024 / 1024).toFixed(1);
        const maxMB = (MAX_LIBRARY_SIZE / 1024 / 1024);
        sizeElement.textContent = `${sizeMB} MB`;

        // Color code based on usage
        const parent = sizeElement.parentElement;
        if (parent) {
            const smallElement = parent.querySelector('small');
            if (totalSize > MAX_LIBRARY_SIZE * 0.8) {
                parent.style.background = '#ffebee';
                if (smallElement) smallElement.style.color = '#c62828';
            } else if (totalSize > MAX_LIBRARY_SIZE * 0.5) {
                parent.style.background = '#fff3cd';
                if (smallElement) smallElement.style.color = '#856404';
            } else {
                parent.style.background = '#e8f5e9';
                if (smallElement) smallElement.style.color = '#2e7d32';
            }
        }
    }
}

// Get total library size
function getTotalLibrarySize() {
    let total = 0;
    mediaLibrary.videos.forEach(v => total += v.size);
    mediaLibrary.audio.forEach(a => total += a.size);
    return total;
}

// Apply video playback speed
function applyVideoSpeed(speed) {
    const video = document.getElementById('bgVideo');
    if (video) {
        video.playbackRate = speed / 100;
    }
}

// Generate static HTML for public page using template system
async function generateStaticHTML(settings, customerId) {
    const baseUrl = 'https://ai-webpages.web.app';

    // Get customer's template type (default to 'classic')
    const templateType = settings.templateType || 'classic';

    // Get template from registry
    let template;
    try {
        template = window.TemplateRegistry.get(templateType);
    } catch (error) {
        console.error('Template not found:', templateType, '- falling back to classic');
        template = window.TemplateRegistry.get('classic');
    }

    // Get template-specific settings
    let templateSettings;
    if (settings[templateType]) {
        templateSettings = settings[templateType];
    } else {
        // If no template-specific settings, use defaults
        console.warn('No settings found for template:', templateType, '- using defaults');
        templateSettings = template.defaultSettings;
    }

    // Prepare media object
    const media = {
        selectedVideo: null,
        selectedAudio: null,
        cardBackground: settings.cardBackground || null,
        allVideos: mediaLibrary.videos,
        allAudio: mediaLibrary.audio,
        allScreenshots: mediaLibrary.screenshots
    };

    // Get selected video
    if (settings.selectedVideoId && settings.selectedVideoId !== 'none') {
        const video = mediaLibrary.videos.find(v => v.id === settings.selectedVideoId);
        if (video && video.url) {
            media.selectedVideo = video;
            // Add poster URL
            if (settings.cardBackground) {
                media.selectedVideo.posterUrl = settings.cardBackground;
            } else {
                const screenshot = mediaLibrary.screenshots.find(s => s.videoName === video.name);
                if (screenshot && screenshot.url) {
                    media.selectedVideo.posterUrl = screenshot.url;
                }
            }
        }
    }

    // Get selected audio
    if (settings.selectedAudioId && settings.selectedAudioId !== 'none') {
        const audio = mediaLibrary.audio.find(a => a.id === settings.selectedAudioId);
        if (audio && audio.url) {
            media.selectedAudio = audio;
        }
    }

    // Generate HTML using template
    const html = await template.generateHTML(templateSettings, media, baseUrl);

    return html;
}

async function saveAllSettings() {
    const card = document.querySelector('.card');
    const cardBgImage = card.style.backgroundImage;
    let cardBackground = '';

    // Extract URL from background-image style
    if (cardBgImage) {
        const match = cardBgImage.match(/url\(['"]?([^'"]+)['"]?\)/);
        if (match) {
            cardBackground = match[1];
        }
    }

    // Get existing settings from Firestore to preserve selectedVideoId/selectedAudioId
    let existingSettings = {};
    try {
        existingSettings = await FirebaseMediaStorage.getSettings();
    } catch (error) {
        console.log('No existing settings, using defaults');
    }

    // Get slug from input (allow empty for root page)
    const slugInput = document.getElementById('slugInput');
    const slug = slugInput ? slugInput.value.trim() : '';

    const settings = {
        ...existingSettings, // Preserve existing settings
        companyName: document.querySelector('[data-field="companyName"]').textContent,
        tagline: document.querySelector('[data-field="tagline"]').textContent,
        aboutTitle: document.querySelector('[data-field="aboutTitle"]').textContent,
        aboutText1: document.querySelector('[data-field="aboutText1"]').textContent,
        aboutText2: document.querySelector('[data-field="aboutText2"]').textContent,
        contactEmail: document.querySelector('[data-field="contactEmail"]').textContent,
        contactPhone: document.querySelector('[data-field="contactPhone"]').textContent,
        contactAddress: document.querySelector('[data-field="contactAddress"]').innerHTML,
        titleSize: parseFloat(document.getElementById('titleSizeSlider').value),
        bodySize: parseFloat(document.getElementById('bodySizeSlider').value),
        fontColor: document.getElementById('fontColorPicker').value,
        minTransparency: parseInt(document.getElementById('minTransparencySlider').value),
        maxTransparency: parseInt(document.getElementById('maxTransparencySlider').value),
        animDuration: parseFloat(document.getElementById('animSpeedSlider').value),
        videoSpeed: parseInt(document.getElementById('videoSpeedSlider').value),
        cardBackground: cardBackground,
        slug: slug // Empty string is valid for root page
    };

    try {
        const saveBtn = document.getElementById('saveBtn');
        const originalText = saveBtn.textContent;

        // Save to Firestore
        saveBtn.textContent = '💾 Saving settings...';
        await FirebaseMediaStorage.saveSettings(settings);
        console.log('💾 Settings saved to Firestore');

        // Generate and save static HTML
        saveBtn.textContent = '📄 Generating static page...';
        const staticHTML = await generateStaticHTML(settings, customerId);
        // Use 'index' for root page (empty slug), otherwise use the slug value
        const pageSlug = settings.slug === '' ? 'index' : settings.slug;
        const storageRef = storage.ref(`public-pages/${pageSlug}.html`);
        const blob = new Blob([staticHTML], { type: 'text/html' });
        await storageRef.put(blob, {
            contentType: 'text/html',
            cacheControl: 'public, max-age=300'
        });
        console.log(`📄 Static page saved: public-pages/${pageSlug}.html`);

        // Show success message
        saveBtn.textContent = '✅ Saved!';
        saveBtn.style.background = '#28a745';

        setTimeout(() => {
            saveBtn.textContent = originalText;
            saveBtn.style.background = '';
        }, 2000);
    } catch (error) {
        console.error('❌ Error saving settings:', error);
        const saveBtn = document.getElementById('saveBtn');
        saveBtn.textContent = '❌ Error saving';
        setTimeout(() => {
            saveBtn.textContent = '💾 Save All Changes';
        }, 2000);
    }
}

// Load saved settings from Firestore
async function loadSavedSettings() {
    let settings;
    try {
        settings = await FirebaseMediaStorage.getSettings();
    } catch (error) {
        console.log('No saved settings, using defaults');
        return;
    }

    if (!settings) return;

    // Apply text content
    if (settings.companyName) {
        document.querySelector('[data-field="companyName"]').textContent = settings.companyName;
    }
    if (settings.tagline) {
        document.querySelector('[data-field="tagline"]').textContent = settings.tagline;
    }
    if (settings.aboutTitle) {
        document.querySelector('[data-field="aboutTitle"]').textContent = settings.aboutTitle;
    }
    if (settings.aboutText1) {
        document.querySelector('[data-field="aboutText1"]').textContent = settings.aboutText1;
    }
    if (settings.aboutText2) {
        document.querySelector('[data-field="aboutText2"]').textContent = settings.aboutText2;
    }
    if (settings.contactEmail) {
        const emailEl = document.querySelector('[data-field="contactEmail"]');
        emailEl.textContent = settings.contactEmail;
        emailEl.href = 'mailto:' + settings.contactEmail;
    }
    if (settings.contactPhone) {
        const phoneEl = document.querySelector('[data-field="contactPhone"]');
        phoneEl.textContent = settings.contactPhone;
        phoneEl.href = 'tel:' + settings.contactPhone.replace(/\s/g, '');
    }
    if (settings.contactAddress) {
        document.querySelector('[data-field="contactAddress"]').innerHTML = settings.contactAddress;
    }

    // Apply control values
    if (settings.titleSize) {
        document.getElementById('titleSizeSlider').value = settings.titleSize;
        document.getElementById('titleSizeVal').textContent = settings.titleSize;
        document.querySelector('.logo h1').style.fontSize = settings.titleSize + 'rem';
    }
    if (settings.bodySize) {
        document.getElementById('bodySizeSlider').value = settings.bodySize;
        document.getElementById('bodySizeVal').textContent = settings.bodySize;
        document.querySelectorAll('.about-text').forEach(el => {
            el.style.fontSize = settings.bodySize + 'rem';
        });
    }
    if (settings.fontColor) {
        document.getElementById('fontColorPicker').value = settings.fontColor;
        applyFontColor(settings.fontColor);
    }
    if (settings.minTransparency !== undefined) {
        document.getElementById('minTransparencySlider').value = settings.minTransparency;
        document.getElementById('minTransparencyVal').textContent = settings.minTransparency;
    }
    if (settings.maxTransparency !== undefined) {
        document.getElementById('maxTransparencySlider').value = settings.maxTransparency;
        document.getElementById('maxTransparencyVal').textContent = settings.maxTransparency;
    }
    if (settings.animDuration) {
        document.getElementById('animSpeedSlider').value = settings.animDuration;
        document.getElementById('animSpeedVal').textContent = settings.animDuration;
    }
    if (settings.minTransparency !== undefined && settings.maxTransparency !== undefined && settings.animDuration) {
        updateOverlayAnimation(settings.minTransparency, settings.maxTransparency, settings.animDuration);
    }
    if (settings.videoSpeed) {
        document.getElementById('videoSpeedSlider').value = settings.videoSpeed;
        document.getElementById('videoSpeedVal').textContent = settings.videoSpeed;
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
    // Always update slug input, even if empty (for root page)
    const slugInput = document.getElementById('slugInput');
    const publicUrlPreview = document.getElementById('publicUrlPreview');
    if (slugInput) {
        slugInput.value = settings.slug || '';
    }
    if (publicUrlPreview) {
        const slugText = settings.slug || '';
        publicUrlPreview.textContent = slugText ? `https://ai-webpages.web.app/${slugText}` : 'https://ai-webpages.web.app/';
    }
}
