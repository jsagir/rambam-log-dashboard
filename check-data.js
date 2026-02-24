const fs = require('fs');
const data = JSON.parse(fs.readFileSync('public/dashboard-data.json', 'utf8'));
console.log('First item keys:', Object.keys(data.results[0]));
console.log('Has anomalies:', data.results[0].anomalies !== undefined);
console.log('Anomalies keys:', data.results[0].anomalies ? Object.keys(data.results[0].anomalies) : 'N/A');
