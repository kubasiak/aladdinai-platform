const { chromium } = require('playwright');

async function setupFirebase() {
    console.log('🚀 Starting Firebase automated setup...\n');

    // Launch browser
    const browser = await chromium.launch({
        headless: false, // Show browser so user can see progress
        slowMo: 500 // Slow down for visibility
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        // Navigate to Firebase Console
        console.log('📍 Opening Firebase Console...');
        await page.goto('https://console.firebase.google.com/');

        // Wait for user to be logged in and main page to load
        console.log('⏳ Waiting for login... (if needed, please log in)');
        await page.waitForTimeout(5000); // Wait for any redirects

        // Look for "Add project" or "Create a project" button
        console.log('🔍 Looking for "Add project" button...');

        try {
            // Try different selectors for the Add Project button
            const addProjectButton = await page.waitForSelector(
                'text=Add project, text=Create a project, [aria-label*="project"]',
                { timeout: 10000 }
            );

            console.log('✅ Found "Add project" button, clicking...');
            await addProjectButton.click();

        } catch (error) {
            console.log('⚠️ Could not find "Add project" button automatically.');
            console.log('Please click "Add project" in the browser window...');
            console.log('Waiting 30 seconds...');
            await page.waitForTimeout(30000);
        }

        // Enter project name
        console.log('📝 Entering project name: aladdinai-platform');
        await page.waitForTimeout(2000);

        try {
            const projectNameInput = await page.waitForSelector('input[type="text"]', { timeout: 5000 });
            await projectNameInput.fill('aladdinai-platform');

            // Wait and click Continue
            await page.waitForTimeout(1000);
            const continueButton = await page.locator('button:has-text("Continue")').first();
            await continueButton.click();

        } catch (error) {
            console.log('⚠️ Could not auto-fill project name.');
            console.log('Please manually enter "aladdinai-platform" and click Continue');
            await page.waitForTimeout(20000);
        }

        // Handle Google Analytics page
        console.log('⏭️ Handling Google Analytics option...');
        await page.waitForTimeout(3000);

        try {
            // Try to find and click the Continue button
            const analyticsButton = await page.locator('button:has-text("Continue")').first();
            await analyticsButton.click();
        } catch (error) {
            console.log('Please click Continue on the Google Analytics screen...');
            await page.waitForTimeout(15000);
        }

        // Wait for project creation
        console.log('⏳ Waiting for project to be created...');
        await page.waitForTimeout(10000);

        try {
            const continueButton = await page.locator('button:has-text("Continue")').first();
            await continueButton.click();
        } catch (error) {
            // May already be past this screen
        }

        console.log('✅ Project created!');
        console.log('🎯 Now navigating to Project Settings...');

        // Wait for dashboard to load
        await page.waitForTimeout(5000);

        // Go to project settings
        try {
            // Click the settings gear icon
            const settingsIcon = await page.waitForSelector('[aria-label*="Settings"], [aria-label*="settings"]', { timeout: 5000 });
            await settingsIcon.click();
            await page.waitForTimeout(1000);

            // Click "Project settings"
            const projectSettings = await page.locator('text=Project settings').first();
            await projectSettings.click();

        } catch (error) {
            console.log('⚠️ Could not navigate to settings automatically.');
            console.log('Please click the gear icon ⚙️ → Project Settings');
            await page.waitForTimeout(20000);
        }

        await page.waitForTimeout(3000);

        // Find and click the Web app button
        console.log('🌐 Registering web app...');

        try {
            // Look for the </> (web) icon button
            const webAppButton = await page.waitForSelector('button[aria-label*="web"], button:has-text("</>"))', { timeout: 5000 });
            await webAppButton.click();

            await page.waitForTimeout(2000);

            // Enter app name
            const appNameInput = await page.waitForSelector('input[type="text"]');
            await appNameInput.fill('aladdinai-web');

            // Click Register app
            const registerButton = await page.locator('button:has-text("Register app")').first();
            await registerButton.click();

        } catch (error) {
            console.log('⚠️ Please manually:');
            console.log('1. Click the </> (Web) icon');
            console.log('2. Enter app name: aladdinai-web');
            console.log('3. Click "Register app"');
            await page.waitForTimeout(30000);
        }

        // Wait for config to appear
        console.log('⏳ Waiting for Firebase config...');
        await page.waitForTimeout(5000);

        // Try to extract the config
        console.log('📋 Extracting Firebase configuration...');

        try {
            // Look for the config in the page
            const configText = await page.textContent('pre, code');
            console.log('\n✅ Firebase Configuration Found!\n');
            console.log('Saving to firebase-config-raw.txt...\n');

            // Save raw config
            const fs = require('fs');
            fs.writeFileSync('firebase-config-raw.txt', configText);

            console.log('Config saved! Check firebase-config-raw.txt');

        } catch (error) {
            console.log('⚠️ Could not auto-extract config.');
            console.log('Please copy the firebaseConfig object and save it manually.');
        }

        console.log('\n✅ Firebase setup process complete!');
        console.log('Keeping browser open for 60 seconds so you can review...');

        await page.waitForTimeout(60000);

    } catch (error) {
        console.error('❌ Error during setup:', error.message);
        console.log('Browser will stay open for manual intervention...');
        await page.waitForTimeout(60000);
    } finally {
        await browser.close();
    }
}

setupFirebase().catch(console.error);
