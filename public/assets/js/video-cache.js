// Video Cache using IndexedDB
// Caches downloaded videos locally for faster screenshot generation

const VideoCache = {
    dbName: 'videoCacheDB',
    storeName: 'videos',
    db: null,

    // Initialize IndexedDB
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ Video cache initialized');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: 'url' });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                    console.log('✅ Video cache store created');
                }
            };
        });
    },

    // Save video blob to cache
    async set(url, blob) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);

            const data = {
                url: url,
                blob: blob,
                timestamp: Date.now(),
                size: blob.size
            };

            const request = store.put(data);
            request.onsuccess = () => {
                console.log('💾 Video cached:', url.substring(0, 50) + '...', 'Size:', blob.size);
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    },

    // Get video blob from cache
    async get(url) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(url);

            request.onsuccess = () => {
                if (request.result) {
                    console.log('📦 Video found in cache:', url.substring(0, 50) + '...');
                    resolve(request.result.blob);
                } else {
                    console.log('❌ Video not in cache:', url.substring(0, 50) + '...');
                    resolve(null);
                }
            };
            request.onerror = () => reject(request.error);
        });
    },

    // Check if video exists in cache
    async has(url) {
        const blob = await this.get(url);
        return blob !== null;
    },

    // Clear old cache entries (older than 7 days)
    async clearOld(maxAge = 7 * 24 * 60 * 60 * 1000) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const index = store.index('timestamp');
            const cutoffTime = Date.now() - maxAge;

            const request = index.openCursor();
            let deletedCount = 0;

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    if (cursor.value.timestamp < cutoffTime) {
                        cursor.delete();
                        deletedCount++;
                    }
                    cursor.continue();
                } else {
                    console.log(`🧹 Cleared ${deletedCount} old cached videos`);
                    resolve(deletedCount);
                }
            };
            request.onerror = () => reject(request.error);
        });
    },

    // Get cache size
    async getSize() {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            request.onsuccess = () => {
                const totalSize = request.result.reduce((sum, item) => sum + (item.size || 0), 0);
                const count = request.result.length;
                console.log(`📊 Cache: ${count} videos, ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
                resolve({ count, totalSize, totalMB: totalSize / 1024 / 1024 });
            };
            request.onerror = () => reject(request.error);
        });
    },

    // Clear all cache
    async clear() {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.clear();

            request.onsuccess = () => {
                console.log('🧹 Video cache cleared');
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    }
};

console.log('✅ Video cache module loaded');
