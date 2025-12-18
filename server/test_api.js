const http = require('http');

const req = http.request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/clients',
    method: 'GET'
}, (res) => {
    let data = '';

    res.on('data', chunk => { data += chunk; });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log(`API Status: ${res.statusCode}`);
            console.log(`API returned ${Array.isArray(json) ? json.length : 'not array'} items.`);
            if (Array.isArray(json) && json.length > 0) {
                console.log('Sample:', json[0]);
            } else {
                console.log('Body:', data);
            }
        } catch (e) {
            console.log('Response not JSON:', data);
        }
    });
});

req.on('error', (e) => {
    console.error('Request error:', e.message);
});

req.end();
