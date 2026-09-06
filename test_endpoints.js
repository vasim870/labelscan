const http = require('http');

const urls = [
  '/',
  '/style.css',
  '/js/data.js',
  '/js/rules-engine.js',
  '/js/scanner.js',
  '/js/map.js',
  '/js/grievance.js',
  '/js/dashboard.js',
  '/js/app.js',
  '/assets/compliant_pack.jpg',
  '/assets/dual_mrp_pack.jpg',
  '/assets/missing_usp_pack.jpg',
  '/assets/imported_missing_origin.jpg',
  '/manifest.json',
  '/sw.js',
  '/assets/icon.svg'
];

async function checkUrl(path) {
  return new Promise((resolve) => {
    http.get(`http://127.0.0.1:8080${path}`, (res) => {
      let len = 0;
      res.on('data', chunk => len += chunk.length);
      res.on('end', () => {
        resolve({ path, status: res.statusCode, length: len, type: res.headers['content-type'] });
      });
    }).on('error', (err) => {
      resolve({ path, status: 'ERROR', error: err.message });
    });
  });
}

async function run() {
  console.log("Checking all endpoints...");
  for (const u of urls) {
    const r = await checkUrl(u);
    console.log(`${r.path.padEnd(36)} -> ${r.status} (${r.length} bytes, ${r.type})`);
  }
}

run();
