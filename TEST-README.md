# AladdinAI Platform - Page Testing Suite

Complete automated testing for all pages in the platform.

## Setup

Install dependencies:
```bash
npm install
```

This will install Puppeteer (headless Chrome browser for testing).

## Running Tests

Run all page tests:
```bash
npm test
```

Or directly:
```bash
node test-all-pages.js
```

## What Gets Tested

The test suite checks **all URLs** listed in `pages.txt`:

### Public Pages
- ✅ Root page (/)
- ✅ Index redirect (/index.html)
- ✅ Login page (/login.html)
- ✅ Registration page (/register.html)

### Customer Pages (Requires Auth)
- ✅ Admin panel (/admin.html)
- ✅ Template selector (/template-selector.html)

### Provider Pages
- ✅ Provider dashboard (/provider.html)

### Utility/Testing Pages
- ✅ Old page viewer (/page.html)
- ✅ List pages utility (/list-pages.html)
- ✅ Setup customers utility (/setup-customers.html)
- ✅ Test deployment page (/test-deploy.html)

### Dynamic Pages
- ✅ Example customer pages (/:slug)
- ✅ 404 error handling

### Static Assets
- ✅ Favicon (/favicon.svg)
- ✅ Firebase config (/firebase-config.js)
- ✅ Stylesheets (/assets/css/*.css)
- ✅ JavaScript files (/assets/js/*.js)

## Test Checks

For each page, the test:

1. **Loads the page** using headless Chrome
2. **Checks HTTP status** (200 OK, 404 Not Found, etc.)
3. **Monitors console output**:
   - Errors (red)
   - Warnings (yellow)
   - Logs (gray)
4. **Detects JavaScript errors**
5. **Checks redirects** (e.g., auth pages → login)
6. **Measures load time**
7. **Takes screenshots** of failed pages

## Test Output

### Console Output
Real-time colored output showing:
- ✅ Green = Passed
- ❌ Red = Failed
- ⚠️ Yellow = Warnings
- 🔀 Blue = Redirects

### JSON Report
Detailed results saved to:
```
test-results.json
```

Contains:
- All test results
- Console errors/warnings
- Load times
- Redirect chains
- Error messages

### HTML Report
Beautiful visual report saved to:
```
test-report.html
```

Open in browser to see:
- Summary statistics
- Failed tests with details
- Console errors
- Load times
- Categorized results

### Screenshots
Failed pages get screenshots saved to:
```
test-screenshots/
```

## Example Output

```
================================================================================
🚀 AladdinAI Platform - Page Testing Suite
================================================================================
Base URL: https://ai-webpages.web.app

🌐 Launching browser...

================================================================================
Public Pages
================================================================================

📄 Testing: Root page
   URL: https://ai-webpages.web.app/
   ✅ PASS - Status: 200 - Load time: 1234ms
   🔀 Redirected to: https://ai-webpages.web.app/login.html

📄 Testing: Login page
   URL: https://ai-webpages.web.app/login.html
   ✅ PASS - Status: 200 - Load time: 456ms

================================================================================
📊 Test Summary
================================================================================
Total tests: 20
✅ Passed: 18
❌ Failed: 2
⚠️  Warnings: 1
⏱️  Duration: 12.34s

📄 Detailed report saved: ./test-results.json
📄 HTML report saved: ./test-report.html
```

## Interpreting Results

### Status Codes
- **200 OK** - Page loaded successfully
- **404 Not Found** - Page doesn't exist (expected for 404 test)
- **500 Server Error** - Backend issue
- **Timeout** - Page took too long to load

### Auth Redirects
Pages requiring authentication will redirect to `/login.html`. This is **expected behavior** and shows as:
```
✅ PASS - Status: 200
🔀 Redirected to: https://ai-webpages.web.app/login.html
🔒 Auth redirect to login (expected)
```

### Console Errors
Some console errors are expected (e.g., auth failures before login). The test distinguishes between:
- **Critical errors** (page won't load)
- **Warnings** (page loads but has issues)

## Continuous Integration

Add to GitHub Actions:
```yaml
- name: Install dependencies
  run: npm install

- name: Run page tests
  run: npm test
```

## Troubleshooting

### Puppeteer Installation Issues
```bash
# Install Chromium manually
npx puppeteer browsers install chrome
```

### Tests Timeout
Increase timeout in `test-all-pages.js`:
```javascript
timeout: 60000  // 60 seconds
```

### Screenshot Failures
Make sure `test-screenshots/` directory exists:
```bash
mkdir test-screenshots
```

## Adding New Pages to Test

Edit `test-all-pages.js` and add to `PAGES_TO_TEST`:

```javascript
'Your Category': [
    {
        url: `${BASE_URL}/your-page.html`,
        name: 'Your page name',
        requiresAuth: false  // or true
    }
]
```

## Full URL List

All tested URLs are documented in:
```
pages.txt
```

With full descriptions, access levels, and features.
