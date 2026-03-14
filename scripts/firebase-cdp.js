const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');

async function getPages() {
    return new Promise((resolve, reject) => {
        http.get('http://localhost:9222/json', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });
}

async function sendCommand(ws, method, params = {}) {
    return new Promise((resolve, reject) => {
        const id = Date.now();
        const message = JSON.stringify({ id, method, params });

        const handler = (data) => {
            const response = JSON.parse(data);
            if (response.id === id) {
                ws.removeListener('message', handler);
                if (response.error) {
                    reject(new Error(response.error.message));
                } else {
                    resolve(response.result);
                }
            }
        };

        ws.on('message', handler);
        ws.send(message);

        setTimeout(() => {
            ws.removeListener('message', handler);
            reject(new Error('Command timeout'));
        }, 30000);
    });
}

async function main() {
    console.log('🔍 Finding Firebase Console tab...');

    const pages = await getPages();
    let firebasePage = pages.find(p => p.url.includes('firebase.google.com'));

    if (!firebasePage) {
        console.log('❌ Firebase Console not found in open tabs');
        console.log('Please make sure Firebase Console is open in Edge');
        return;
    }

    console.log('✅ Found Firebase Console tab');
    console.log('📡 Connecting via CDP...');

    const ws = new WebSocket(firebasePage.webSocketDebuggerUrl);

    await new Promise((resolve, reject) => {
        ws.on('open', resolve);
        ws.on('error', reject);
        setTimeout(() => reject(new Error('Connection timeout')), 10000);
    });

    console.log('✅ Connected to browser');

    // Enable necessary domains with timeout handling
    try {
        await sendCommand(ws, 'Runtime.enable');
        console.log('✅ Runtime enabled');
    } catch (e) {
        console.log('⚠️  Runtime enable failed:', e.message);
    }

    console.log('🔍 Checking current page URL...');

    // Get current URL
    const { result } = await sendCommand(ws, 'Runtime.evaluate', {
        expression: 'window.location.href',
        returnByValue: true
    });

    console.log('📍 Current URL:', result.value);

    // Try to extract Firebase config if it's visible
    console.log('🔍 Looking for Firebase config on page...');

    const configCheck = await sendCommand(ws, 'Runtime.evaluate', {
        expression: `
            (function() {
                // Try to find config in various places
                const codeBlocks = document.querySelectorAll('pre, code');
                for (const block of codeBlocks) {
                    const text = block.textContent;
                    if (text.includes('apiKey') && text.includes('authDomain')) {
                        return text;
                    }
                }

                // Try to find in script tags
                const scripts = document.querySelectorAll('script');
                for (const script of scripts) {
                    if (script.textContent.includes('firebaseConfig')) {
                        return script.textContent;
                    }
                }

                return null;
            })()
        `,
        returnByValue: true
    });

    if (configCheck.result.value) {
        console.log('✅ Found Firebase config!');
        console.log('\n' + configCheck.result.value + '\n');

        fs.writeFileSync('firebase-config-extracted.txt', configCheck.result.value);
        console.log('💾 Saved to firebase-config-extracted.txt');
    } else {
        console.log('⚠️  Config not visible on current page');
        console.log('\n📋 Manual steps needed:');
        console.log('1. In the Edge window, navigate through Firebase Console');
        console.log('2. Go to Project Settings → Your Apps → Web');
        console.log('3. The config should appear');
        console.log('\nOr tell me what you see on the page and I can help navigate!');
    }

    ws.close();
}

main().catch(console.error);
