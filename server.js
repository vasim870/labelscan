const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const BASE_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  const urlParts = req.url.split('?');
  let reqPath = decodeURI(urlParts[0]);

  // Handle Backend API Routes (/api/...)
  if (reqPath.startsWith('/api/')) {
    const routeName = reqPath.replace(/^\/api\//, '').replace(/\.js$/, '');
    const apiFilePath = path.join(BASE_DIR, 'api', `${routeName}.js`);

    if (fs.existsSync(apiFilePath)) {
      let bodyData = '';
      let bodySize = 0;
      const MAX_BODY_SIZE = 10 * 1024 * 1024; // 10MB to handle base64 images

      req.on('data', chunk => {
        bodySize += chunk.length;
        if (bodySize > MAX_BODY_SIZE) {
          req.destroy(new Error('Request body too large'));
          return;
        }
        bodyData += chunk;
      });
      req.on('end', () => {
        try {
          if (bodyData) {
            req.body = JSON.parse(bodyData);
          }
        } catch (_) {
          req.body = bodyData;
        }

        try {
          // Delete require cache in development for instant hot updates
          delete require.cache[require.resolve(apiFilePath)];
          const handler = require(apiFilePath);
          return handler(req, res);
        } catch (apiErr) {
          console.error("API execution error:", apiErr);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: apiErr.message }));
        }
      });
      return;
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: `API route /api/${routeName} not found` }));
    }
  }


  // Handle Static File Serving
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  const filePath = path.join(BASE_DIR, reqPath);

  // Prevent directory traversal
  if (!filePath.startsWith(BASE_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('Forbidden');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('404 Not Found');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Service-Worker-Allowed': '/'
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`LabelScan server running locally: http://localhost:${PORT}`);
  console.log(`LabelScan mobile network URL:   http://10.165.19.122:${PORT}`);
});
