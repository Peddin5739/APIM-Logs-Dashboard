const http = require('http'); // Use http for local

const GATEWAY_BASE = 'localhost';
const PORT = 3002; // Match backend port

const endpoints = [
    // Erebor
    { method: 'POST', path: '/erebor/1.0/quotes' },
    { method: 'GET', path: '/erebor/1.0/quotes/0992355b-1ffd-4ac9-aaa4-8e2cc518ed6d/status' },
    { method: 'PUT', path: '/erebor/1.0/quotes/0ca94fd0-5cd7-4fb0-b08c-6e78ccd1dc19' },

    // ImageRight
    { method: 'POST', path: '/shrimagerightdocument/1.0/v1.0/Upload' },

    // Elevate
    { method: 'POST', path: '/elevate-mgu/1.0/submissions' },
    { method: 'PUT', path: '/elevate-mgu/1.0/submissions' },
    { method: 'POST', path: '/elevate-mgu/1.0/quotes' },

    // Elevate Kafka
    { method: 'POST', path: '/kafka/1.0/topics/EREBOR_pas_submissions/records' },
    { method: 'POST', path: '/kafka/1.0/topics/EREBOR_pas_quotes/records' },
    { method: 'POST', path: '/kafka/1.0/topics/EREBOR_pas_policies/records' }
];

let requestsSent = 0;
const maxRequests = 200;

function sendRequest() {
    if (requestsSent >= maxRequests) {
        console.log(`\x1b[32mTarget reached: ${requestsSent} requests sent. Stopping.\x1b[0m`);
        process.exit(0);
    }

    const ep = endpoints[Math.floor(Math.random() * endpoints.length)];
    const options = {
        hostname: GATEWAY_BASE,
        port: PORT,
        path: ep.path,
        method: ep.method,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const req = http.request(options, (res) => {
        requestsSent++;
        console.log(`[${requestsSent}/${maxRequests}] ${ep.method} ${ep.path} -> ${res.statusCode}`);
    });

    req.on('error', (e) => {
        console.error(`Request failed: ${e.message}`);
    });

    if (ep.method === 'POST' || ep.method === 'PUT') {
        req.write(JSON.stringify({ test: "Multi-API Traffic" }));
    }
    req.end();
}

console.log(`Starting expanded traffic generation (${maxRequests} requests)...`);
setInterval(sendRequest, 500); // 2 requests per second
