const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3333;

const TYPES = {
  '.js':   'application/javascript; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
};

http.createServer(function (req, res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, max-age=60');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  var urlPath = req.url.split('?')[0];
  if (urlPath === '/' || urlPath === '') urlPath = '/demo.html';

  var filePath = path.join(__dirname, urlPath);

  fs.readFile(filePath, function (err, data) {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Not found: ' + urlPath);
    }
    var ext  = path.extname(filePath);
    var mime = TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
}).listen(PORT, function () {
  console.log('Bubble widget server running at http://localhost:' + PORT);
  console.log('  bubble.js  →  http://localhost:' + PORT + '/bubble.js');
  console.log('  demo       →  http://localhost:' + PORT + '/');
});
