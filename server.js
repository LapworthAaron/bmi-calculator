const http = require('http');
const fs   = require('fs');
const path = require('path');
const ROOT = __dirname;
const PORT = process.env.PORT || 3101;

const MIME = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'text/javascript',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
  '.xml':  'application/xml',
  '.txt':  'text/plain',
  '.svg':  'image/svg+xml',
};

http.createServer((req, res) => {
  const raw  = req.url.split('?')[0];
  const url  = raw === '/' ? '/index.html' : raw;
  const file = path.join(ROOT, url);
  fs.readFile(file, (err, data) => {
    if (err) {
      // Clean URLs: try appending .html (e.g. /about → /about.html)
      if (!path.extname(file)) {
        const htmlFile = file + '.html';
        return fs.readFile(htmlFile, (err2, data2) => {
          if (err2) { res.writeHead(404); res.end('Not found'); return; }
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(data2);
        });
      }
      res.writeHead(404); res.end('Not found'); return;
    }
    const ext = path.extname(file);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
    res.end(data);
  });
}).listen(PORT, () => console.log(`Server ready on http://localhost:${PORT}`));
