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
  '/api/stats',
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

async function testPostEndpoint(path, postData) {
  return new Promise((resolve) => {
    const data = JSON.stringify(postData);
    const req = http.request(`http://127.0.0.1:8080${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({ path, status: res.statusCode, response: JSON.parse(body) });
      });
    });
    req.on('error', (err) => resolve({ path, status: 'ERROR', error: err.message }));
    req.write(data);
    req.end();
  });
}

async function run() {
  console.log("=== CHECKING ALL STATIC & API ENDPOINTS ===");
  let passed = true;
  for (const u of urls) {
    const r = await checkUrl(u);
    console.log(`${r.path.padEnd(36)} -> ${r.status} (${r.length} bytes, ${r.type})`);
    if (r.status !== 200) passed = false;
  }

  console.log("\n=== TESTING BACKEND POST APIS ===");
  const scanTest = await testPostEndpoint('/api/scan', {
    text: "BRITANNIA GOOD DAY\nM R P Rs. 3O.OO/-\nNet Wt: 12Og\nMRD: 02/2026\nEXP: 08/2026\nUSP Rs. 0.25 / g\nMade in India",
    name: "Good Day Biscuits"
  });
  console.log(`/api/scan POST status: ${scanTest.status} (MRP: ₹${scanTest.response.extractedData.mrp}, Qty: ${scanTest.response.extractedData.netWeight}, MFD: ${scanTest.response.extractedData.mfgDate})`);
  if (scanTest.status !== 200 || scanTest.response.extractedData.mrp !== 30) passed = false;

  const auditTest = await testPostEndpoint('/api/audit', {
    packet: scanTest.response.extractedData
  });
  console.log(`/api/audit POST status: ${auditTest.status} (Verdict: ${auditTest.response.verdict}, Score: ${auditTest.response.complianceScore}%)`);
  if (auditTest.status !== 200) passed = false;

  if (passed) {
    console.log("\n>>> ALL TESTS PASSED SUCCESSFULLY! <<<");
    process.exit(0);
  } else {
    console.error("\n>>> SOME TESTS FAILED! <<<");
    process.exit(1);
  }
}

run();
