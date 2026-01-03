const https = require('https');

const GATEWAY_BASE = 'YOUR_APIM_GATEWAY_URL'; // e.g. apim-service.azure-api.net
const KEY = 'YOUR_SUBSCRIPTION_KEY';

const endpoints = [
    { method: 'GET', path: '/quotes/quotes' },
    { method: 'POST', path: '/quotes/quotes' },
    { method: 'GET', path: '/quotes/quotes/367fdcc0-a09c-4a51-8014-0aa76a4c6576/status' },
    { method: 'PUT', path: '/quotes/quotes/367fdcc0-a09c-4a51-8014-0aa76a4c6576' },
    { method: 'GET', path: '/quotes/invalid-path' }, // Force some extra 404s
];

function sendRequest() {
    const ep = endpoints[Math.floor(Math.random() * endpoints.length)];
    const options = {
        hostname: GATEWAY_BASE,
        path: ep.path,
        method: ep.method,
        headers: {
            'Ocp-Apim-Subscription-Key': KEY,
            'Content-Type': 'application/json',
            'Authorization': 'Bearer placeholder-token'
        }
    };

    const req = https.request(options, (res) => {
        console.log(`[${new Date().toISOString()}] ${ep.method} ${ep.path} -> ${res.statusCode}`);
    });

    req.on('error', (e) => {
        console.error(`Status: Request failed: ${e.message}`);
    });

    if (ep.method === 'POST' || ep.method === 'PUT') {
        req.write(JSON.stringify({
            meta: {
                ApiVersion: "0.4.0",
                TransactionType: ep.method === 'POST' ? 'C' : 'U'
            },
            data: {
                Submission: { Insured: { InsuredName: "Real Traffic Test" }, EffectiveDate: "2026/01/10" }
            }
        }));
    }
    req.end();
}

console.log('Starting refined traffic generation (1 request per second)...');
setInterval(sendRequest, 1000);
