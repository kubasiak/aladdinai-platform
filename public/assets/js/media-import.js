/**
 * Media Import/Export Functionality
 * Allows exporting media library to JSON and importing from another project
 */

const MediaImportExport = {
    /**
     * Export media library to JSON file
     * Downloads a JSON file with all videos, audio, and screenshots
     */
    async exportMediaLibrary() {
        try {
            console.log('📥 Exporting media library...');

            // Get all media from current library
            const videos = await FirebaseMediaStorage.getAllVideos();
            const audio = await FirebaseMediaStorage.getAllAudio();
            const screenshots = await FirebaseMediaStorage.getAllScreenshots();

            // Create export data
            const exportData = {
                version: '1.0',
                exportDate: new Date().toISOString(),
                customerId: customerId || 'unknown',
                media: {
                    videos: videos.map(v => ({
                        id: v.id,
                        name: v.name,
                        data: v.data,
                        size: v.size,
                        type: v.type,
                        uploadDate: v.uploadDate
                    })),
                    audio: audio.map(a => ({
                        id: a.id,
                        name: a.name,
                        data: a.data,
                        size: a.size,
                        type: a.type,
                        uploadDate: a.uploadDate
                    })),
                    screenshots: screenshots.map(s => ({
                        id: s.id,
                        videoName: s.videoName,
                        data: s.data,
                        timestamp: s.timestamp,
                        uploadDate: s.uploadDate
                    }))
                },
                stats: {
                    totalVideos: videos.length,
                    totalAudio: audio.length,
                    totalScreenshots: screenshots.length,
                    totalSize: this.calculateTotalSize(videos, audio, screenshots)
                }
            };

            // Convert to JSON
            const jsonString = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });

            // Create download link
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `media-export-${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            console.log('✅ Media library exported successfully');
            alert(`Export successful!\n\nVideos: ${exportData.stats.totalVideos}\nAudio: ${exportData.stats.totalAudio}\nScreenshots: ${exportData.stats.totalScreenshots}\nTotal size: ${this.formatSize(exportData.stats.totalSize)}`);

            return true;
        } catch (error) {
            console.error('❌ Error exporting media library:', error);
            alert('Error exporting media library: ' + error.message);
            return false;
        }
    },

    /**
     * Import media library from JSON file
     * Uploads media to current customer's storage
     */
    async importMediaLibrary(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = async (e) => {
                try {
                    console.log('📤 Importing media library...');

                    // Parse JSON
                    const importData = JSON.parse(e.target.result);

                    // Validate import data
                    if (!importData.version || !importData.media) {
                        throw new Error('Invalid import file format');
                    }

                    // Confirm import
                    const confirmed = confirm(
                        `Import media library?\n\n` +
                        `Videos: ${importData.stats.totalVideos}\n` +
                        `Audio: ${importData.stats.totalAudio}\n` +
                        `Screenshots: ${importData.stats.totalScreenshots}\n` +
                        `Total size: ${this.formatSize(importData.stats.totalSize)}\n\n` +
                        `This will add to your existing media library.`
                    );

                    if (!confirmed) {
                        console.log('Import cancelled by user');
                        resolve({ success: false, cancelled: true });
                        return;
                    }

                    // Track progress
                    let imported = {
                        videos: 0,
                        audio: 0,
                        screenshots: 0,
                        errors: []
                    };

                    // Import videos
                    for (const video of importData.media.videos) {
                        try {
                            // Remove ID to create new entry
                            const videoData = {
                                name: video.name,
                                data: video.data,
                                size: video.size,
                                type: video.type,
                                uploadDate: new Date().toISOString()
                            };
                            await FirebaseMediaStorage.saveVideo(videoData);
                            imported.videos++;
                            console.log(`✓ Imported video: ${video.name}`);
                        } catch (error) {
                            console.error(`✗ Failed to import video: ${video.name}`, error);
                            imported.errors.push(`Video: ${video.name} - ${error.message}`);
                        }
                    }

                    // Import audio
                    for (const audioItem of importData.media.audio) {
                        try {
                            const audioData = {
                                name: audioItem.name,
                                data: audioItem.data,
                                size: audioItem.size,
                                type: audioItem.type,
                                uploadDate: new Date().toISOString()
                            };
                            await FirebaseMediaStorage.saveAudio(audioData);
                            imported.audio++;
                            console.log(`✓ Imported audio: ${audioItem.name}`);
                        } catch (error) {
                            console.error(`✗ Failed to import audio: ${audioItem.name}`, error);
                            imported.errors.push(`Audio: ${audioItem.name} - ${error.message}`);
                        }
                    }

                    // Import screenshots
                    for (const screenshot of importData.media.screenshots) {
                        try {
                            const screenshotData = {
                                videoName: screenshot.videoName,
                                data: screenshot.data,
                                timestamp: screenshot.timestamp,
                                uploadDate: new Date().toISOString()
                            };
                            await FirebaseMediaStorage.saveScreenshot(screenshotData);
                            imported.screenshots++;
                            console.log(`✓ Imported screenshot: ${screenshot.videoName}`);
                        } catch (error) {
                            console.error(`✗ Failed to import screenshot: ${screenshot.videoName}`, error);
                            imported.errors.push(`Screenshot: ${screenshot.videoName} - ${error.message}`);
                        }
                    }

                    console.log('✅ Media import complete');

                    // Show results
                    let message = `Import complete!\n\n` +
                        `Imported:\n` +
                        `Videos: ${imported.videos}\n` +
                        `Audio: ${imported.audio}\n` +
                        `Screenshots: ${imported.screenshots}`;

                    if (imported.errors.length > 0) {
                        message += `\n\nErrors: ${imported.errors.length}\n` +
                            imported.errors.slice(0, 3).join('\n');
                        if (imported.errors.length > 3) {
                            message += `\n... and ${imported.errors.length - 3} more`;
                        }
                    }

                    alert(message);

                    // Reload media library in UI
                    if (typeof mediaLibrary !== 'undefined' && typeof loadMediaLibrary === 'function') {
                        mediaLibrary = await loadMediaLibrary();
                        if (typeof renderMediaLibrary === 'function') {
                            renderMediaLibrary();
                        }
                        if (typeof renderScreenshotLibrary === 'function') {
                            await renderScreenshotLibrary();
                        }
                        if (typeof updateLibraryStats === 'function') {
                            updateLibraryStats();
                        }
                    }

                    resolve({ success: true, imported });
                } catch (error) {
                    console.error('❌ Error importing media library:', error);
                    alert('Error importing media library: ' + error.message);
                    reject(error);
                }
            };

            reader.onerror = () => {
                const error = new Error('Failed to read file');
                console.error('❌', error);
                alert('Error reading file');
                reject(error);
            };

            reader.readAsText(file);
        });
    },

    /**
     * Calculate total size of media items
     */
    calculateTotalSize(videos, audio, screenshots) {
        let total = 0;
        videos.forEach(v => total += (v.size || 0));
        audio.forEach(a => total += (a.size || 0));
        // Screenshots don't have size property in current implementation
        return total;
    },

    /**
     * Format size in bytes to human-readable format
     */
    formatSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }
};

// Make available globally
if (typeof window !== 'undefined') {
    window.MediaImportExport = MediaImportExport;
}

// Export for Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MediaImportExport;
}
