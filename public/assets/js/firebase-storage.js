// Firebase Storage Abstraction Layer
// Replaces IndexedDB with Firebase Firestore + Storage

const FirebaseMediaStorage = {
    customerId: null,

    // Initialize with customer ID
    async init(customerId) {
        this.customerId = customerId || getCurrentCustomerId();
        if (!this.customerId) {
            throw new Error('Customer ID required');
        }
        console.log('Firebase Storage initialized for customer:', this.customerId);
        return Promise.resolve();
    },

    // Save video to Firebase Storage and metadata to Firestore
    async saveVideo(videoData) {
        const customerId = this.customerId;
        const videoId = Date.now().toString();

        // Upload video file to Firebase Storage
        const storageRef = storage.ref(`customers/${customerId}/videos/${videoId}`);

        // Convert base64 to blob
        const blob = await fetch(videoData.data).then(r => r.blob());

        // Upload
        await storageRef.put(blob, {
            contentType: videoData.type,
            customMetadata: {
                originalName: videoData.name,
                customerId: customerId
            }
        });

        // Get download URL
        const downloadURL = await storageRef.getDownloadURL();

        // Save metadata to Firestore
        const metadata = {
            id: videoId,
            name: videoData.name,
            size: videoData.size,
            type: videoData.type,
            url: downloadURL,
            storagePath: `customers/${customerId}/videos/${videoId}`,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            customerId: customerId
        };

        await db.collection('customers').doc(customerId)
            .collection('videos').doc(videoId).set(metadata);

        return videoId;
    },

    // Save audio to Firebase
    async saveAudio(audioData) {
        const customerId = this.customerId;
        const audioId = Date.now().toString();

        const storageRef = storage.ref(`customers/${customerId}/audio/${audioId}`);
        const blob = await fetch(audioData.data).then(r => r.blob());

        await storageRef.put(blob, {
            contentType: audioData.type,
            customMetadata: {
                originalName: audioData.name,
                customerId: customerId
            }
        });

        const downloadURL = await storageRef.getDownloadURL();

        const metadata = {
            id: audioId,
            name: audioData.name,
            size: audioData.size,
            type: audioData.type,
            url: downloadURL,
            storagePath: `customers/${customerId}/audio/${audioId}`,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            customerId: customerId
        };

        await db.collection('customers').doc(customerId)
            .collection('audio').doc(audioId).set(metadata);

        return audioId;
    },

    // Save screenshot to Firebase
    async saveScreenshot(screenshotData) {
        const customerId = this.customerId;
        const screenshotId = Date.now().toString();

        const storageRef = storage.ref(`customers/${customerId}/screenshots/${screenshotId}`);
        const blob = await fetch(screenshotData.data).then(r => r.blob());

        await storageRef.put(blob, {
            contentType: 'image/jpeg',
            customMetadata: {
                videoName: screenshotData.videoName,
                customerId: customerId
            }
        });

        const downloadURL = await storageRef.getDownloadURL();

        const metadata = {
            id: screenshotId,
            name: screenshotData.name,
            url: downloadURL,
            videoName: screenshotData.videoName,
            storagePath: `customers/${customerId}/screenshots/${screenshotId}`,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            customerId: customerId
        };

        await db.collection('customers').doc(customerId)
            .collection('screenshots').doc(screenshotId).set(metadata);

        return screenshotId;
    },

    // Get all videos for customer
    async getAllVideos() {
        const customerId = this.customerId;
        const snapshot = await db.collection('customers').doc(customerId)
            .collection('videos').orderBy('timestamp', 'desc').get();

        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    // Get all audio for customer
    async getAllAudio() {
        const customerId = this.customerId;
        const snapshot = await db.collection('customers').doc(customerId)
            .collection('audio').orderBy('timestamp', 'desc').get();

        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    // Get all screenshots for customer
    async getAllScreenshots() {
        const customerId = this.customerId;
        const snapshot = await db.collection('customers').doc(customerId)
            .collection('screenshots').orderBy('timestamp', 'desc').get();

        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    // Get specific item
    async get(collection, id) {
        const customerId = this.customerId;
        const doc = await db.collection('customers').doc(customerId)
            .collection(collection).doc(id).get();

        if (!doc.exists) return null;
        return { id: doc.id, ...doc.data() };
    },

    // Delete item
    async delete(collection, id) {
        const customerId = this.customerId;

        // Get item to find storage path
        const item = await this.get(collection, id);
        if (!item) return;

        // Delete from storage
        if (item.storagePath) {
            const storageRef = storage.ref(item.storagePath);
            await storageRef.delete();
        }

        // Delete from Firestore
        await db.collection('customers').doc(customerId)
            .collection(collection).doc(id).delete();
    },

    // Save settings
    async saveSettings(settings) {
        const customerId = this.customerId;
        await db.collection('customers').doc(customerId).set({
            settings: settings,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    },

    // Get settings
    async getSettings() {
        const customerId = this.customerId;
        const doc = await db.collection('customers').doc(customerId).get();

        if (!doc.exists || !doc.data().settings) {
            return this.getDefaultSettings();
        }

        return doc.data().settings;
    },

    // Default settings
    getDefaultSettings() {
        return {
            companyName: 'Your Company',
            tagline: 'Your Tagline Here',
            aboutTitle: 'About Us',
            aboutText1: 'Tell your story...',
            aboutText2: 'More about your company...',
            contactEmail: 'contact@example.com',
            contactPhone: '+1 234 567 8900',
            contactAddress: 'Your Address',
            titleSize: 4,
            bodySize: 1.1,
            fontColor: '#ffffff',
            minTransparency: 0,
            maxTransparency: 30,
            animDuration: 10.7,
            videoSpeed: 100,
            selectedVideoId: null,
            selectedAudioId: null,
            cardBackground: null
        };
    }
};

console.log('Firebase Storage abstraction loaded');
