// Provider Dashboard Logic
// For platform owner to manage limits and view customer usage

const PROVIDER_EMAIL = 'kubasiak.anna@gmail.com'; // Provider email

// Firebase pricing constants (Blaze plan)
const PRICING = {
    storageFreeGB: 5, // 5GB free
    storagePricePerGB: 0.026, // $0.026/GB/month after free tier
    bandwidthFreeDailyGB: 1, // 1GB/day free
    bandwidthFreeMonthlyGB: 30, // ~30GB/month
    bandwidthPricePerGB: 0.12, // $0.12/GB after free tier
};

let platformLimits = {
    maxFileSize: 50, // MB
    storagePerCustomer: 500, // MB
    maxVideoSize: 50, // MB
    maxAudioSize: 20, // MB
};

let bandwidthLimits = {
    hourlyThresholdMB: 500, // MB/hour
    dailyThresholdMB: 5000, // MB/day (5GB)
    mbPerView: 10, // Estimated MB per page view
    forceImageMode: false // Emergency switch
};

let allCustomers = [];

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            console.log('Not authenticated, redirecting to login...');
            window.location.href = 'login.html';
            return;
        }

        // Check if user is provider
        if (user.email !== PROVIDER_EMAIL) {
            alert('❌ Access denied. Provider accounts only.');
            await auth.signOut();
            window.location.href = 'index.html';
            return;
        }

        console.log('✅ Provider authenticated:', user.email);

        // Load dashboard
        await loadDashboard();
    });
});

// Load dashboard data
async function loadDashboard() {
    try {
        // Load platform limits from Firestore
        await loadPlatformLimits();

        // Load all customers
        await loadAllCustomers();

        // Calculate platform stats
        const stats = calculatePlatformStats();

        // Render stats
        renderStats(stats);

        // Render customers table
        renderCustomersTable();

        // Show dashboard
        document.getElementById('loadingIndicator').style.display = 'none';
        document.getElementById('dashboardContent').style.display = 'block';
    } catch (error) {
        console.error('Error loading dashboard:', error);
        document.getElementById('loadingIndicator').innerHTML = '❌ Error loading dashboard: ' + error.message;
    }
}

// Load platform limits from Firestore
async function loadPlatformLimits() {
    try {
        // Load storage limits
        const doc = await db.collection('platform').doc('limits').get();
        if (doc.exists) {
            platformLimits = doc.data();
            // Update form fields
            document.getElementById('maxFileSize').value = platformLimits.maxFileSize;
            document.getElementById('storagePerCustomer').value = platformLimits.storagePerCustomer;
            document.getElementById('maxVideoSize').value = platformLimits.maxVideoSize || 50;
            document.getElementById('maxAudioSize').value = platformLimits.maxAudioSize || 20;
        }

        // Load bandwidth limits
        const bwDoc = await db.collection('platform').doc('bandwidth-limits').get();
        if (bwDoc.exists) {
            bandwidthLimits = bwDoc.data();
            // Update bandwidth form fields
            document.getElementById('hourlyThreshold').value = bandwidthLimits.hourlyThresholdMB;
            document.getElementById('dailyThreshold').value = bandwidthLimits.dailyThresholdMB;
            document.getElementById('mbPerView').value = bandwidthLimits.mbPerView;
            document.getElementById('forceImageMode').checked = bandwidthLimits.forceImageMode || false;
        }
    } catch (error) {
        console.log('No platform limits found, using defaults');
    }
}

// Save platform limits to Firestore
async function saveLimits() {
    try {
        platformLimits = {
            maxFileSize: parseInt(document.getElementById('maxFileSize').value),
            storagePerCustomer: parseInt(document.getElementById('storagePerCustomer').value),
            maxVideoSize: parseInt(document.getElementById('maxVideoSize').value),
            maxAudioSize: parseInt(document.getElementById('maxAudioSize').value),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('platform').doc('limits').set(platformLimits);

        alert('✅ Storage limits saved successfully!');
        console.log('💾 Platform limits saved:', platformLimits);

        // Reload dashboard
        await loadDashboard();
    } catch (error) {
        console.error('Error saving limits:', error);
        alert('❌ Error saving limits: ' + error.message);
    }
}

// Save bandwidth limits to Firestore
async function saveBandwidthLimits() {
    try {
        bandwidthLimits = {
            hourlyThresholdMB: parseInt(document.getElementById('hourlyThreshold').value),
            dailyThresholdMB: parseInt(document.getElementById('dailyThreshold').value),
            mbPerView: parseInt(document.getElementById('mbPerView').value),
            forceImageMode: document.getElementById('forceImageMode').checked,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('platform').doc('bandwidth-limits').set(bandwidthLimits);

        alert('✅ Bandwidth limits saved successfully!');
        console.log('💾 Bandwidth limits saved:', bandwidthLimits);

        // Reload dashboard
        await loadDashboard();
    } catch (error) {
        console.error('Error saving bandwidth limits:', error);
        alert('❌ Error saving bandwidth limits: ' + error.message);
    }
}

// Load all customers from Firestore
async function loadAllCustomers() {
    try {
        const snapshot = await db.collection('customers').get();

        allCustomers = await Promise.all(snapshot.docs.map(async (doc) => {
            const customerId = doc.id;
            const customerData = doc.data();

            // Get customer's storage usage
            const usage = await getCustomerStorageUsage(customerId);

            return {
                id: customerId,
                email: customerData.email || 'Unknown',
                settings: customerData.settings || {},
                usage: usage,
                createdAt: customerData.createdAt
            };
        }));

        console.log('📊 Loaded', allCustomers.length, 'customers');
    } catch (error) {
        console.error('Error loading customers:', error);
        allCustomers = [];
    }
}

// Get customer's storage usage
async function getCustomerStorageUsage(customerId) {
    try {
        // Get all videos
        const videosSnapshot = await db.collection('customers').doc(customerId)
            .collection('videos').get();

        // Get all audio
        const audioSnapshot = await db.collection('customers').doc(customerId)
            .collection('audio').get();

        // Get all screenshots
        const screenshotsSnapshot = await db.collection('customers').doc(customerId)
            .collection('screenshots').get();

        // Calculate total size
        let totalSize = 0;
        let fileCount = 0;

        videosSnapshot.docs.forEach(doc => {
            const data = doc.data();
            totalSize += data.size || 0;
            fileCount++;
        });

        audioSnapshot.docs.forEach(doc => {
            const data = doc.data();
            totalSize += data.size || 0;
            fileCount++;
        });

        screenshotsSnapshot.docs.forEach(doc => {
            const data = doc.data();
            // Screenshots don't have size, estimate 200KB each
            totalSize += 200 * 1024;
            fileCount++;
        });

        return {
            totalBytes: totalSize,
            totalMB: (totalSize / 1024 / 1024).toFixed(2),
            fileCount: fileCount,
            videos: videosSnapshot.size,
            audio: audioSnapshot.size,
            screenshots: screenshotsSnapshot.size
        };
    } catch (error) {
        console.error('Error getting usage for customer', customerId, error);
        return {
            totalBytes: 0,
            totalMB: 0,
            fileCount: 0,
            videos: 0,
            audio: 0,
            screenshots: 0
        };
    }
}

// Calculate platform statistics
function calculatePlatformStats() {
    const totalCustomers = allCustomers.length;

    // Total storage used across all customers (in MB)
    const totalStorageMB = allCustomers.reduce((sum, customer) => {
        return sum + parseFloat(customer.usage.totalMB);
    }, 0);

    // Total files
    const totalFiles = allCustomers.reduce((sum, customer) => {
        return sum + customer.usage.fileCount;
    }, 0);

    // Calculate costs
    const storageCost = calculateStorageCost(totalStorageMB);

    // Estimate bandwidth cost (assume 10GB/month per customer on average)
    const estimatedBandwidthGB = totalCustomers * 10;
    const bandwidthCost = calculateBandwidthCost(estimatedBandwidthGB);

    const totalCost = storageCost + bandwidthCost;

    return {
        totalCustomers,
        totalStorageMB: totalStorageMB.toFixed(2),
        totalStorageGB: (totalStorageMB / 1024).toFixed(2),
        totalFiles,
        storageCost: storageCost.toFixed(2),
        bandwidthCost: bandwidthCost.toFixed(2),
        totalCost: totalCost.toFixed(2)
    };
}

// Calculate storage cost
function calculateStorageCost(storageMB) {
    const storageGB = storageMB / 1024;
    if (storageGB <= PRICING.storageFreeGB) {
        return 0; // Within free tier
    }
    const chargeableGB = storageGB - PRICING.storageFreeGB;
    return chargeableGB * PRICING.storagePricePerGB;
}

// Calculate bandwidth cost
function calculateBandwidthCost(bandwidthGB) {
    if (bandwidthGB <= PRICING.bandwidthFreeMonthlyGB) {
        return 0; // Within free tier
    }
    const chargeableGB = bandwidthGB - PRICING.bandwidthFreeMonthlyGB;
    return chargeableGB * PRICING.bandwidthPricePerGB;
}

// Render platform stats
function renderStats(stats) {
    const statsGrid = document.getElementById('statsGrid');

    statsGrid.innerHTML = `
        <div class="stat-card">
            <h3>Total Customers</h3>
            <div class="stat-value">${stats.totalCustomers}</div>
            <div class="stat-subtext">Active accounts</div>
        </div>

        <div class="stat-card">
            <h3>Total Storage</h3>
            <div class="stat-value">${stats.totalStorageGB} GB</div>
            <div class="stat-subtext">${stats.totalFiles} files (${((stats.totalStorageGB / PRICING.storageFreeGB) * 100).toFixed(1)}% of free tier)</div>
        </div>

        <div class="stat-card">
            <h3>Storage Cost</h3>
            <div class="stat-value">$${stats.storageCost}</div>
            <div class="stat-subtext">Per month (Free tier: ${PRICING.storageFreeGB}GB)</div>
        </div>

        <div class="stat-card">
            <h3>Estimated Total Cost</h3>
            <div class="stat-value">$${stats.totalCost}</div>
            <div class="stat-subtext">Storage + bandwidth (est.)</div>
        </div>
    `;
}

// Render customers table
function renderCustomersTable() {
    const tbody = document.getElementById('customersTableBody');

    if (allCustomers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: #999;">
                    No customers found
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = allCustomers.map(customer => {
        const usageMB = parseFloat(customer.usage.totalMB);
        const limitMB = platformLimits.storagePerCustomer;
        const usagePercent = (usageMB / limitMB) * 100;

        // Determine status
        let statusBadge, barClass;
        if (usagePercent >= 90) {
            statusBadge = '<span class="badge badge-danger">Critical</span>';
            barClass = 'danger';
        } else if (usagePercent >= 70) {
            statusBadge = '<span class="badge badge-warning">High</span>';
            barClass = 'warning';
        } else {
            statusBadge = '<span class="badge badge-success">Normal</span>';
            barClass = '';
        }

        // Calculate cost for this customer
        const customerCost = calculateStorageCost(usageMB);
        const costIndicator = customerCost > 0
            ? `<span class="cost-paid">$${customerCost.toFixed(2)}/mo</span>`
            : '<span class="cost-free">$0.00 (Free)</span>';

        return `
            <tr>
                <td><code>${customer.id.substring(0, 8)}...</code></td>
                <td>${customer.email}</td>
                <td>${usageMB} MB / ${limitMB} MB<br><small>${customer.usage.fileCount} files (${customer.usage.videos}v, ${customer.usage.audio}a, ${customer.usage.screenshots}s)</small></td>
                <td>
                    <div class="usage-bar">
                        <div class="usage-bar-fill ${barClass}" style="width: ${Math.min(usagePercent, 100)}%"></div>
                        <div class="usage-text">${usagePercent.toFixed(1)}%</div>
                    </div>
                </td>
                <td>${statusBadge}</td>
                <td class="cost-indicator">${costIndicator}</td>
            </tr>
        `;
    }).join('');
}

// Create new customer account
async function createNewCustomer() {
    const emailInput = document.getElementById('newCustomerEmail').value.trim();
    const password = document.getElementById('newCustomerPassword').value;
    const displayName = document.getElementById('newCustomerName').value.trim();
    const statusDiv = document.getElementById('createCustomerStatus');

    if (!emailInput || !password) {
        statusDiv.innerHTML = '<p style="color: #dc3545;">❌ Email/username and password are required</p>';
        return;
    }

    if (password.length < 6) {
        statusDiv.innerHTML = '<p style="color: #dc3545;">❌ Password must be at least 6 characters</p>';
        return;
    }

    // Convert username to email format if no @ present
    let email;
    if (emailInput.includes('@')) {
        email = emailInput;
    } else {
        email = emailInput + '@auth.aladdinai.local';
    }

    statusDiv.innerHTML = '<p style="color: #667eea;">⏳ Creating account...</p>';

    try {
        // Create user with Firebase Auth
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const uid = userCredential.user.uid;

        // Save customer metadata to Firestore
        await db.collection('customers').doc(uid).set({
            email: emailInput, // Store original input (username or email)
            displayName: displayName || emailInput,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdBy: PROVIDER_EMAIL
        });

        statusDiv.innerHTML = `
            <p style="color: #28a745;">✅ Customer account created!</p>
            <p><strong>Login credentials:</strong></p>
            <p>Username: ${emailInput}</p>
            <p>Password: ${password}</p>
            <p>Customer ID: ${uid}</p>
            <p>Public URL: <a href="/?customer=${uid}" target="_blank">View Page</a></p>
        `;

        // Clear form
        document.getElementById('newCustomerEmail').value = '';
        document.getElementById('newCustomerPassword').value = '';
        document.getElementById('newCustomerName').value = '';

        // Sign out the newly created user and sign provider back in
        await auth.signOut();
        // Provider will be redirected by onAuthStateChanged, but let's wait a moment
        setTimeout(() => {
            window.location.reload();
        }, 3000);

    } catch (error) {
        console.error('Error creating customer:', error);

        let errorMessage = 'Error creating account';
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'This email/username is already in use';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Invalid email format';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'Password is too weak';
        }

        statusDiv.innerHTML = `<p style="color: #dc3545;">❌ ${errorMessage}</p>`;
    }
}

// Logout
async function logout() {
    try {
        await auth.signOut();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error signing out:', error);
        window.location.href = 'index.html';
    }
}

console.log('✅ Provider dashboard loaded');
