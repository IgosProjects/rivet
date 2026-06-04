"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../src/index");
const app = new index_1.Rivet();
// Set a cookie
app.get('/set', (req, res) => {
    res.SetCookie('theme', 'dark', {
        maxAge: 3600,
        path: '/',
        httpOnly: true,
    });
    res.SetCookie('language', 'en', { maxAge: 3600 });
    res.send('Cookies set! Check your browser dev tools.');
});
// Read all cookies
app.get('/cookies', (req, res) => {
    res.json({
        cookies: req.cookies,
        message: 'Cookies received from browser',
    });
});
// Read specific cookie
app.get('/theme', (req, res) => {
    const theme = req.cookies.theme || 'light';
    res.json({ theme, message: `Current theme is ${theme}` });
});
// Update cookie
app.get('/update-theme/:newTheme', (req, res) => {
    const { newTheme } = req.params;
    res.SetCookie('theme', newTheme, { maxAge: 3600 });
    res.json({ message: `Theme updated to ${newTheme}` });
});
// Clear a cookie
app.get('/clear-theme', (req, res) => {
    res.clearCookie('theme');
    res.send('Theme cookie cleared!');
});
// Clear all cookies (by clearing individual ones)
app.get('/clear-all', (req, res) => {
    Object.keys(req.cookies).forEach((name) => {
        res.ClearCookie(name);
    });
    res.send('All cookies cleared!');
});
// Simple page to test in browser
app.get('/', (req, res) => {
    res.sendAsType(`
        <!DOCTYPE HTML>
        <html>
        <head><title>Rivet Cookie Test</title></head>
        <body>
            <h1>Rivet Cookie Test</h1>
            <div id="cookies"></div>
            <button onclick="setCookies()">Set Cookies</button>
            <button onclick="getCookies()">Get Cookies</button>
            <button onclick="clearTheme()">Clear Theme</button>
            <button onclick="clearAll()">Clear All</button>
            
            <script>
                async function setCookies() {
                    const res = await fetch('/set');
                    const text = await res.text();
                    alert(text);
                    getCookies();
                }
                
                async function getCookies() {
                    const res = await fetch('/cookies');
                    const data = await res.json();
                    document.getElementById('cookies').innerHTML = 
                        '<pre>' + JSON.stringify(data.cookies, null, 2) + '</pre>';
                }
                
                async function clearTheme() {
                    const res = await fetch('/clear-theme');
                    const text = await res.text();
                    alert(text);
                    getCookies();
                }
                
                async function clearAll() {
                    const res = await fetch('/clear-all');
                    const text = await res.text();
                    alert(text);
                    getCookies();
                }
                
                getCookies();
            </script>
        </body>
        </html>
    `, 'text/html');
});
app.start(3000, () => {
    console.log('🍪 Cookie test server running at http://localhost:3000');
});
//# sourceMappingURL=cookies.js.map