/**
 * AladdinAI Platform - Complete Page Testing Suite
 * Tests all URLs for loading, console errors, and network issues
 *
 * Run: node test-all-pages.js
 * Requires: npm install puppeteer
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

const BASE_URL = 'https://ai-webpages.web.app';

// All pages to test
const PAGES_TO_TEST = {
    'Public Pages': [
        { url: `${BASE_URL}/`, name: 'Root page' },
        { url: `${BASE_URL}/index.html`, name: 'Index redirect' },
        { url: `${BASE_URL}/login.html`, name: 'Login page' },
        { url: `${BASE_URL}/register.html`, name: 'Registration page (deprecated)' },
    ],
    'Customer Pages (Requires Auth)': [
        { url: `${BASE_URL}/admin.html`, name: 'Admin panel', requiresAuth: true },
        { url: `${BASE_URL}/template-selector.html`, name: 'Template selector', requiresAuth: true },
    ],
    'Provider Pages (Requires Provider Auth)': [
        { url: `${BASE_URL}/provider.html`, name: 'Provider dashboard', requiresAuth: true, requiresProvider: true },
    ],
    'Utility/Testing Pages': [
        { url: `${BASE_URL}/page.html`, name: 'Old page viewer (legacy)' },
        { url: `${BASE_URL}/list-pages.html`, name: 'List pages utility' },
        { url: `${BASE_URL}/setup-customers.html`, name: 'Setup customers utility' },
        { url: `${BASE_URL}/test-deploy.html`, name: 'Test deployment page' },
    ],
    'Dynamic Pages (Examples)': [
        { url: `${BASE_URL}/aladdinai`, name: 'AladdinAI demo page' },
        { url: `${BASE_URL}/nonexistent-slug-test-404`, name: '404 test (should fail)', expectError: true },
    ],
    'Static Assets': [
        { url: `${BASE_URL}/favicon.svg`, name: 'Favicon', isAsset: true },
        { url: `${BASE_URL}/firebase-config.js`, name: 'Firebase config', isAsset: true },
        { url: `${BASE_URL}/assets/css/styles.css`, name: 'Main stylesheet', isAsset: true },
        { url: `${BASE_URL}/assets/js/admin-firebase.js`, name: 'Admin JS', isAsset: true },
    ]
};

// Test results storage
const results = {
    passed: [],
    failed: [],
    warnings: [],
    total: 0,
    startTime: new Date(),
    endTime: null
};

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m'
};

function log(message, color = 'reset') {
    console.log(colors[color] + message + colors.reset);
}

function logSection(title) {
    console.log('\n' + '='.repeat(80));
    log(title, 'cyan');
    console.log('='.repeat(80));
}

async function testPage(browser, page, testCase) {
    const { url, name, requiresAuth, requiresProvider, expectError, isAsset } = testCase;
    const testResult = {
        url,
        name,
        success: false,
        status: null,
        consoleErrors: [],
        consoleWarnings: [],
        consoleLogs: [],
        networkErrors: [],
        loadTime: null,
        redirected: false,
        finalUrl: null,
        error: null
    };

    log(`\n📄 Testing: ${name}`, 'blue');
    log(`   URL: ${url}`, 'gray');

    const startTime = Date.now();

    try {
        // Listen for console messages
        page.on('console', msg => {
            const type = msg.type();
            const text = msg.text();

            if (type === 'error') {
                testResult.consoleErrors.push(text);
            } else if (type === 'warning') {
                testResult.consoleWarnings.push(text);
            } else if (type === 'log') {
                testResult.consoleLogs.push(text);
            }
        });

        // Listen for page errors
        page.on('pageerror', error => {
            testResult.consoleErrors.push(`Page Error: ${error.message}`);
        });

        // Navigate to page
        const response = await page.goto(url, {
            waitUntil: 'networkidle0',
            timeout: 30000
        });

        testResult.loadTime = Date.now() - startTime;
        testResult.status = response.status();
        testResult.finalUrl = page.url();
        testResult.redirected = testResult.finalUrl !== url;

        // Check if page loaded successfully
        if (isAsset) {
            // Assets just need 200 status
            testResult.success = testResult.status === 200;
        } else if (expectError) {
            // This page should return 404
            testResult.success = testResult.status === 404;
        } else if (requiresAuth) {
            // Auth pages should either load or redirect to login
            testResult.success = testResult.status === 200 || testResult.finalUrl.includes('login.html');
            if (testResult.finalUrl.includes('login.html')) {
                testResult.authRedirect = true;
            }
        } else {
            // Regular pages should load with 200
            testResult.success = testResult.status === 200;
        }

        // Log results
        if (testResult.success) {
            log(`   ✅ PASS - Status: ${testResult.status} - Load time: ${testResult.loadTime}ms`, 'green');
        } else {
            log(`   ❌ FAIL - Status: ${testResult.status}`, 'red');
        }

        if (testResult.redirected) {
            log(`   🔀 Redirected to: ${testResult.finalUrl}`, 'yellow');
        }

        if (testResult.authRedirect) {
            log(`   🔒 Auth redirect to login (expected)`, 'cyan');
        }

        // Log console errors
        if (testResult.consoleErrors.length > 0) {
            log(`   ⚠️  Console Errors (${testResult.consoleErrors.length}):`, 'red');
            testResult.consoleErrors.slice(0, 5).forEach(err => {
                log(`      - ${err.substring(0, 100)}`, 'gray');
            });
            if (testResult.consoleErrors.length > 5) {
                log(`      ... and ${testResult.consoleErrors.length - 5} more`, 'gray');
            }
        }

        // Log console warnings
        if (testResult.consoleWarnings.length > 0) {
            log(`   ⚠️  Console Warnings (${testResult.consoleWarnings.length})`, 'yellow');
        }

        // Take screenshot for failed pages (non-assets only)
        if (!testResult.success && !isAsset) {
            const screenshotPath = `./test-screenshots/failed-${name.replace(/[^a-z0-9]/gi, '-')}.png`;
            await page.screenshot({ path: screenshotPath, fullPage: true });
            testResult.screenshot = screenshotPath;
            log(`   📸 Screenshot saved: ${screenshotPath}`, 'gray');
        }

    } catch (error) {
        testResult.error = error.message;
        testResult.success = expectError ? true : false; // If we expect error, timeout/error is OK
        log(`   ❌ ERROR: ${error.message}`, 'red');
    }

    // Store result
    if (testResult.success) {
        results.passed.push(testResult);
    } else {
        results.failed.push(testResult);
    }

    if (testResult.consoleErrors.length > 0 && testResult.success) {
        results.warnings.push(testResult);
    }

    results.total++;

    return testResult;
}

async function runTests() {
    logSection('🚀 AladdinAI Platform - Page Testing Suite');
    log(`Base URL: ${BASE_URL}`, 'cyan');
    log(`Start time: ${results.startTime.toISOString()}`, 'gray');

    // Create screenshot directory
    if (!fs.existsSync('./test-screenshots')) {
        fs.mkdirSync('./test-screenshots');
    }

    // Launch browser
    log('\n🌐 Launching browser...', 'cyan');
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Run tests for each category
    for (const [category, tests] of Object.entries(PAGES_TO_TEST)) {
        logSection(category);

        for (const test of tests) {
            await testPage(browser, page, test);
        }
    }

    await browser.close();

    // Generate summary
    results.endTime = new Date();
    const duration = (results.endTime - results.startTime) / 1000;

    logSection('📊 Test Summary');
    log(`Total tests: ${results.total}`, 'cyan');
    log(`✅ Passed: ${results.passed.length}`, 'green');
    log(`❌ Failed: ${results.failed.length}`, results.failed.length > 0 ? 'red' : 'green');
    log(`⚠️  Warnings: ${results.warnings.length}`, 'yellow');
    log(`⏱️  Duration: ${duration.toFixed(2)}s`, 'gray');

    // Show failed tests
    if (results.failed.length > 0) {
        logSection('❌ Failed Tests');
        results.failed.forEach(test => {
            log(`\n${test.name} (${test.url})`, 'red');
            log(`  Status: ${test.status}`, 'gray');
            if (test.error) {
                log(`  Error: ${test.error}`, 'gray');
            }
            if (test.consoleErrors.length > 0) {
                log(`  Console errors: ${test.consoleErrors.length}`, 'gray');
            }
        });
    }

    // Show warnings
    if (results.warnings.length > 0) {
        logSection('⚠️  Pages with Console Errors (but loaded)');
        results.warnings.forEach(test => {
            log(`\n${test.name} (${test.url})`, 'yellow');
            log(`  Console errors: ${test.consoleErrors.length}`, 'gray');
            test.consoleErrors.slice(0, 3).forEach(err => {
                log(`    - ${err.substring(0, 100)}`, 'gray');
            });
        });
    }

    // Save detailed report
    const reportPath = './test-results.json';
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    log(`\n📄 Detailed report saved: ${reportPath}`, 'cyan');

    // Generate HTML report
    generateHTMLReport(results);

    // Exit with error code if tests failed
    if (results.failed.length > 0) {
        process.exit(1);
    }
}

function generateHTMLReport(results) {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AladdinAI Platform - Test Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
            padding: 20px;
        }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; }
        h1 { color: #333; margin-bottom: 10px; }
        .meta { color: #666; font-size: 0.9rem; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 40px; }
        .stat { padding: 20px; border-radius: 8px; text-align: center; }
        .stat-total { background: #667eea; color: white; }
        .stat-passed { background: #48bb78; color: white; }
        .stat-failed { background: #f56565; color: white; }
        .stat-warnings { background: #ed8936; color: white; }
        .stat-value { font-size: 2.5rem; font-weight: bold; }
        .stat-label { font-size: 0.9rem; margin-top: 5px; opacity: 0.9; }
        .test-category { margin-bottom: 40px; }
        .test-category h2 { color: #333; margin-bottom: 20px; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
        .test-item { background: #f9f9f9; padding: 15px; margin-bottom: 10px; border-radius: 5px; border-left: 4px solid #ddd; }
        .test-item.passed { border-left-color: #48bb78; }
        .test-item.failed { border-left-color: #f56565; background: #fff5f5; }
        .test-item.warning { border-left-color: #ed8936; background: #fffaf0; }
        .test-header { display: flex; align-items: center; gap: 10px; margin-bottom: 5px; }
        .test-status { font-weight: bold; }
        .test-status.passed { color: #48bb78; }
        .test-status.failed { color: #f56565; }
        .test-name { font-weight: 600; color: #333; }
        .test-url { color: #666; font-size: 0.85rem; }
        .test-details { margin-top: 10px; font-size: 0.85rem; color: #666; }
        .error-list { background: #fff; padding: 10px; border-radius: 3px; margin-top: 10px; font-family: monospace; font-size: 0.8rem; }
        .error-item { color: #e53e3e; margin-bottom: 5px; }
        .timestamp { color: #999; font-size: 0.8rem; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧪 AladdinAI Platform - Test Report</h1>
        <div class="meta">
            <div>Generated: ${results.endTime.toISOString()}</div>
            <div>Duration: ${((results.endTime - results.startTime) / 1000).toFixed(2)}s</div>
        </div>

        <div class="summary">
            <div class="stat stat-total">
                <div class="stat-value">${results.total}</div>
                <div class="stat-label">Total Tests</div>
            </div>
            <div class="stat stat-passed">
                <div class="stat-value">${results.passed.length}</div>
                <div class="stat-label">Passed</div>
            </div>
            <div class="stat stat-failed">
                <div class="stat-value">${results.failed.length}</div>
                <div class="stat-label">Failed</div>
            </div>
            <div class="stat stat-warnings">
                <div class="stat-value">${results.warnings.length}</div>
                <div class="stat-label">Warnings</div>
            </div>
        </div>

        ${results.failed.length > 0 ? `
        <div class="test-category">
            <h2>❌ Failed Tests</h2>
            ${results.failed.map(test => `
                <div class="test-item failed">
                    <div class="test-header">
                        <span class="test-status failed">❌ FAILED</span>
                        <span class="test-name">${test.name}</span>
                    </div>
                    <div class="test-url">${test.url}</div>
                    <div class="test-details">
                        Status: ${test.status} | Load time: ${test.loadTime}ms
                        ${test.error ? `<br>Error: ${test.error}` : ''}
                    </div>
                    ${test.consoleErrors.length > 0 ? `
                        <div class="error-list">
                            ${test.consoleErrors.slice(0, 5).map(err => `<div class="error-item">${err}</div>`).join('')}
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>
        ` : ''}

        ${results.warnings.length > 0 ? `
        <div class="test-category">
            <h2>⚠️ Warnings (Loaded but has console errors)</h2>
            ${results.warnings.map(test => `
                <div class="test-item warning">
                    <div class="test-header">
                        <span class="test-status">⚠️ WARNING</span>
                        <span class="test-name">${test.name}</span>
                    </div>
                    <div class="test-url">${test.url}</div>
                    <div class="test-details">
                        Status: ${test.status} | Load time: ${test.loadTime}ms | Console errors: ${test.consoleErrors.length}
                    </div>
                    <div class="error-list">
                        ${test.consoleErrors.slice(0, 3).map(err => `<div class="error-item">${err}</div>`).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
        ` : ''}

        <div class="test-category">
            <h2>✅ Passed Tests</h2>
            ${results.passed.map(test => `
                <div class="test-item passed">
                    <div class="test-header">
                        <span class="test-status passed">✅ PASSED</span>
                        <span class="test-name">${test.name}</span>
                    </div>
                    <div class="test-url">${test.url}</div>
                    <div class="test-details">
                        Status: ${test.status} | Load time: ${test.loadTime}ms
                        ${test.redirected ? ` | Redirected to: ${test.finalUrl}` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>`;

    fs.writeFileSync('./test-report.html', html);
    log('📄 HTML report saved: ./test-report.html', 'cyan');
}

// Run tests
runTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
