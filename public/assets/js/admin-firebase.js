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

// Load media library from IndexedDB
async function loadMediaLibrary() {
    try {
        const videos = await MediaStorage.getAll('videos');
        const audio = await MediaStorage.getAll('audio');
        const screenshots = await MediaStorage.getAll('screenshots');

        // If empty, add default media (nebula first as default)
        if (videos.length === 0) {
            await MediaStorage.saveVideo({
                name: 'Nebula Space Background',
                size: 9400000,
                type: 'video/mp4',
                data: 'assets/media/videos/vecteezy_moving-nebulas-space.mp4',
                timestamp: Date.now(),
                isDefault: true
            });
            await MediaStorage.saveVideo({
                name: 'Background Video - Fast',
                size: 1200000,
                type: 'video/mp4',
                data: 'assets/media/videos/background-video-fast.mp4',
                timestamp: Date.now(),
                isDefault: true
            });
            await MediaStorage.saveVideo({
                name: 'Background Video - Part 1',
                size: 611000,
                type: 'video/mp4',
                data: 'assets/media/videos/background-video-part1.mp4',
                timestamp: Date.now(),
                isDefault: true
            });
        }

        if (audio.length === 0) {
            await MediaStorage.saveAudio({
                name: 'Demo Track 1',
                size: 6600000,
                type: 'audio/mp3',
                data: 'assets/media/audio/Demo Track 1.mp3',
                timestamp: Date.now(),
                isDefault: true
            });
            await MediaStorage.saveAudio({
                name: 'Demo Track 2',
                size: 4900000,
                type: 'audio/mp3',
                data: 'assets/media/audio/Demo Track 2.mp3',
                timestamp: Date.now(),
                isDefault: true
            });
        }

        if (screenshots.length === 0) {
            await MediaStorage.saveScreenshot({
                name: 'Card Background (Nebula)',
                data: 'assets/images/card-background-nebula.jpg',
                videoName: 'Nebula',
                timestamp: Date.now(),
                isDefault: true
            });
            await MediaStorage.saveScreenshot({
                name: 'Card Background (Original)',
                data: 'assets/images/card-background.jpg',
                videoName: 'Original',
                timestamp: Date.now(),
                isDefault: true
            });
        }

        // Reload after adding defaults
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

// Note: No migration needed for Firebase - data is in Firestore

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
function populateMediaDropdowns() {
    // Populate video dropdown
    const videoSelect = document.getElementById('videoSelect');
    videoSelect.innerHTML = '<option value="">-- Select Video --</option>';

    // Add "None" option
    const noneVideoOption = document.createElement('option');
    noneVideoOption.value = 'none';
    noneVideoOption.textContent = '🚫 None (No background video)';
    videoSelect.appendChild(noneVideoOption);

    mediaLibrary.videos.forEach((vid, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `${vid.name} (${(vid.size / 1024 / 1024).toFixed(2)} MB)`;
        videoSelect.appendChild(option);
    });

    const browsVideoOption = document.createElement('option');
    browsVideoOption.value = 'browse';
    browsVideoOption.textContent = '📂 Browse for new video...';
    videoSelect.appendChild(browsVideoOption);

    // Populate audio dropdown
    const audioSelect = document.getElementById('audioSelect');
    audioSelect.innerHTML = '<option value="">-- Select Audio --</option>';

    // Add "None" option
    const noneAudioOption = document.createElement('option');
    noneAudioOption.value = 'none';
    noneAudioOption.textContent = '🚫 None (No background audio)';
    audioSelect.appendChild(noneAudioOption);

    if (mediaLibrary.audio.length === 0) {
        const noAudioOption = document.createElement('option');
        noAudioOption.value = '';
        noAudioOption.textContent = 'No audio files';
        noAudioOption.disabled = true;
        audioSelect.appendChild(noAudioOption);
    } else {
        mediaLibrary.audio.forEach((aud, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `${aud.name} (${(aud.size / 1024 / 1024).toFixed(2)} MB)`;
            audioSelect.appendChild(option);
        });
    }

    const browsAudioOption = document.createElement('option');
    browsAudioOption.value = 'browse';
    browsAudioOption.textContent = '📂 Browse for new audio...';
    audioSelect.appendChild(browsAudioOption);
}

// Initialize admin controls
async function initializeAdmin() {
    await loadSavedSettings();
    setupLiveControls();
    setupEditableFields();
    populateMediaDropdowns();
    renderMediaLibrary();
    await renderScreenshotLibrary();
    updateLibraryStats();

    // Play video
    if (video) {
        video.play().catch(error => console.log('Video autoplay failed:', error));
    }

    // Auto-play first audio if no audio is selected yet
    let currentSettings;
    try {
        currentSettings = await FirebaseMediaStorage.getSettings();
    } catch (error) {
        currentSettings = {};
    }

    if (!currentSettings.selectedAudioId && mediaLibrary.audio.length > 0) {
        useAudio(mediaLibrary.audio[0]);
        const audioSelect = document.getElementById('audioSelect');
        audioSelect.value = 0;
        console.log('🎵 Auto-playing default audio:', mediaLibrary.audio[0].name);
    }
}

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

    // Video dropdown
    const videoSelect = document.getElementById('videoSelect');
    videoSelect.addEventListener('change', function() {
        if (this.value === 'browse') {
            document.getElementById('videoUpload').click();
            this.selectedIndex = 0; // Reset to first option
        } else if (this.value === 'none') {
            // User selected "None" - hide/pause video
            const video = document.getElementById('bgVideo');
            if (video) {
                video.pause();
                video.style.opacity = '0';
            }
            // Save "none" selection
            updateSetting('selectedVideoId', 'none');
            console.log('🚫 Video disabled');
        } else if (this.value) {
            const index = parseInt(this.value);
            const video = document.getElementById('bgVideo');
            if (video) video.style.opacity = '1'; // Show video
            useVideo(mediaLibrary.videos[index]);
        }
    });

    // Video upload
    const videoUpload = document.getElementById('videoUpload');
    videoUpload.addEventListener('change', function(e) {
        handleVideoUpload(e.target.files[0]);
        this.value = ''; // Reset input
    });

    // Audio dropdown
    const audioSelect = document.getElementById('audioSelect');
    audioSelect.addEventListener('change', function() {
        if (this.value === 'browse') {
            document.getElementById('audioUpload').click();
            this.selectedIndex = 0; // Reset to first option
        } else if (this.value === 'none') {
            // User selected "None" - stop audio
            if (backgroundAudio) {
                backgroundAudio.pause();
                backgroundAudio = null;
            }
            // Save "none" selection
            updateSetting('selectedAudioId', 'none');
            console.log('🚫 Audio disabled');
        } else if (this.value) {
            const index = parseInt(this.value);
            useAudio(mediaLibrary.audio[index]);
        }
    });

    // Audio upload
    const audioUpload = document.getElementById('audioUpload');
    audioUpload.addEventListener('change', function(e) {
        handleAudioUpload(e.target.files[0]);
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
        if (confirm('❌ Exit admin mode?')) {
            try {
                await auth.signOut();
                window.location.href = 'index.html';
            } catch (error) {
                console.error('Error signing out:', error);
                window.location.href = 'index.html';
            }
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

    const reader = new FileReader();
    reader.onload = async function(e) {
        const videoData = {
            name: file.name,
            size: file.size,
            type: file.type,
            data: e.target.result,
            timestamp: Date.now()
        };

        try {
            // Save to IndexedDB
            const videoId = await MediaStorage.saveVideo(videoData);
            videoData.id = videoId;

            // Reload library
            mediaLibrary = await loadMediaLibrary();

            // Use the video
            useVideo(videoData);

            // Generate screenshot
            generateScreenshotFromVideo(videoData, async function(screenshotData) {
                try {
                    const screenshotObj = {
                        name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
                        data: screenshotData,
                        videoName: file.name,
                        timestamp: Date.now()
                    };

                    console.log('💾 Saving screenshot to library...');
                    await MediaStorage.saveScreenshot(screenshotObj);

                    console.log('🔄 Reloading library...');
                    mediaLibrary = await loadMediaLibrary();

                    console.log('🖼️ Rendering screenshot library...');
                    await renderScreenshotLibrary();

                    console.log('✅ Screenshot added to Card Background section');
                } catch (error) {
                    console.error('❌ Error saving screenshot:', error);
                }
            });

            renderMediaLibrary();
            populateMediaDropdowns();
            updateLibraryStats();

            // Set the dropdown to show the newly added video
            const videoSelect = document.getElementById('videoSelect');
            const newIndex = mediaLibrary.videos.length - 1;
            videoSelect.value = newIndex;

            console.log('✅ Video uploaded:', file.name, (file.size / 1024 / 1024).toFixed(2) + ' MB');
        } catch (error) {
            console.error('❌ Error saving video:', error);
            alert('Error saving video. Storage might be full.');
        }
    };

    reader.onerror = function(error) {
        console.error('❌ Error reading video file:', error);
        alert('Error uploading video file. Please try again.');
    };

    reader.readAsDataURL(file);
}

// Handle audio upload
async function handleAudioUpload(file) {
    if (!file) return;

    const allowedTypes = ['audio/mp3', 'audio/mpeg', 'audio/ogg', 'audio/wav'];
    if (!validateFile(file, MAX_AUDIO_SIZE, allowedTypes)) return;

    const reader = new FileReader();
    reader.onload = async function(e) {
        const audioData = {
            name: file.name,
            size: file.size,
            type: file.type,
            data: e.target.result,
            timestamp: Date.now()
        };

        try {
            // Save to IndexedDB
            const audioId = await MediaStorage.saveAudio(audioData);
            audioData.id = audioId;

            // Reload library
            mediaLibrary = await loadMediaLibrary();

            // Use the audio
            useAudio(audioData);

            renderMediaLibrary();
            populateMediaDropdowns();
            updateLibraryStats();

            // Set the dropdown to show the newly added audio
            const audioSelect = document.getElementById('audioSelect');
            const newIndex = mediaLibrary.audio.length - 1;
            audioSelect.value = newIndex;

            console.log('✅ Audio uploaded:', file.name, (file.size / 1024 / 1024).toFixed(2) + ' MB');
        } catch (error) {
            console.error('❌ Error saving audio:', error);
            alert('Error saving audio. Storage might be full.');
        }
    };

    reader.onerror = function(error) {
        console.error('❌ Error reading audio file:', error);
        alert('Error uploading audio file. Please try again.');
    };

    reader.readAsDataURL(file);
}

// Use video from library
function useVideo(videoData) {
    const video = document.getElementById('bgVideo');
    const source = video.querySelector('source');
    source.src = videoData.data;
    video.load();
    video.play();

    // Save selected video ID to Firestore for public page
    updateSetting('selectedVideoId', videoData.id);

    console.log('▶️ Playing video:', videoData.name, (videoData.size / 1024 / 1024).toFixed(2) + ' MB');
}

// Use audio from library
function useAudio(audioData) {
    // Stop current audio
    if (backgroundAudio) {
        backgroundAudio.pause();
        backgroundAudio = null;
    }

    // Create new audio
    backgroundAudio = new Audio(audioData.data);
    backgroundAudio.loop = true;
    backgroundAudio.volume = 0.3;
    backgroundAudio.play();

    // Save selected audio ID to Firestore for public page
    updateSetting('selectedAudioId', audioData.id);

    console.log('🔊 Playing audio:', audioData.name, (audioData.size / 1024 / 1024).toFixed(2) + ' MB');
}

// Delete from library
async function deleteFromLibrary(type, index) {
    if (!confirm('🗑️ Delete this file from library?')) return;

    try {
        if (type === 'video') {
            const videoToDelete = mediaLibrary.videos[index];
            await MediaStorage.delete('videos', videoToDelete.id);

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

        renderMediaLibrary();
        populateMediaDropdowns();
        updateLibraryStats();

        console.log('✅ Deleted from library');
    } catch (error) {
        console.error('❌ Error deleting:', error);
        alert('Error deleting file. Please try again.');
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
                </div>
            </div>
        `).join('');
    }
}

// Render media library
function renderMediaLibrary() {
    // Render videos
    const videoLibrary = document.getElementById('videoLibrary');
    if (mediaLibrary.videos.length === 0) {
        videoLibrary.innerHTML = '<div class="library-empty">No videos uploaded</div>';
    } else {
        videoLibrary.innerHTML = mediaLibrary.videos.map((vid, index) => `
            <div class="library-item">
                <div class="library-item-info">
                    <div class="library-item-name">🎬 ${vid.name}</div>
                    <div class="library-item-size">${(vid.size / 1024 / 1024).toFixed(2)} MB</div>
                </div>
                <div class="library-item-actions">
                    <button class="library-btn use" onclick="useVideoFromLibrary(${index})" title="Use this video">▶️</button>
                    <button class="library-btn delete" onclick="deleteVideoFromLibrary(${index})" title="Delete">🗑️</button>
                </div>
            </div>
        `).join('');
    }

    // Render audio
    const audioLibrary = document.getElementById('audioLibrary');
    if (mediaLibrary.audio.length === 0) {
        audioLibrary.innerHTML = '<div class="library-empty">No audio uploaded</div>';
    } else {
        audioLibrary.innerHTML = mediaLibrary.audio.map((aud, index) => `
            <div class="library-item">
                <div class="library-item-info">
                    <div class="library-item-name">🎵 ${aud.name}</div>
                    <div class="library-item-size">${(aud.size / 1024 / 1024).toFixed(2)} MB</div>
                </div>
                <div class="library-item-actions">
                    <button class="library-btn use" onclick="useAudioFromLibrary(${index})" title="Play this audio">▶️</button>
                    <button class="library-btn delete" onclick="deleteAudioFromLibrary(${index})" title="Delete">🗑️</button>
                </div>
            </div>
        `).join('');
    }
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

// Global functions for onclick handlers
window.useVideoFromLibrary = function(index) {
    useVideo(mediaLibrary.videos[index]);
};

window.deleteVideoFromLibrary = function(index) {
    deleteFromLibrary('video', index);
};

window.useAudioFromLibrary = function(index) {
    useAudio(mediaLibrary.audio[index]);
};

window.deleteAudioFromLibrary = function(index) {
    deleteFromLibrary('audio', index);
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

// Save all settings to Firestore
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
        cardBackground: cardBackground
    };

    try {
        // Save to Firestore
        await FirebaseMediaStorage.saveSettings(settings);
        console.log('💾 Settings saved to Firestore:', settings);

        // Show success message
        const saveBtn = document.getElementById('saveBtn');
        const originalText = saveBtn.textContent;
        saveBtn.textContent = '✅ Saved to Cloud!';
        saveBtn.style.background = '#28a745';

        setTimeout(() => {
            saveBtn.textContent = originalText;
            saveBtn.style.background = '';
        }, 2000);
    } catch (error) {
        console.error('❌ Error saving settings:', error);
        alert('Error saving settings: ' + error.message);
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
}
