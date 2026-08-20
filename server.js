const http = require("http");
const fs = require("fs");
const path = require("path");
const { handleApi } = require("./api");
const { rateLimit } = require("./lib/http-helpers");

const PUBLIC_DIR = path.join(__dirname, "public");
const PORT = process.env.PORT || 3000;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

function serveStatic(req, res, pathname) {
  let filePath = path.join(PUBLIC_DIR, decodeURIComponent(pathname));

  // Prevent path traversal outside /public
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  if (pathname === "/") filePath = path.join(PUBLIC_DIR, "index.html");

  fs.stat(filePath, (err, stat) => {
    if (!err && stat.isDirectory()) {
      const indexPath = path.join(filePath, "index.html");
      return fs.stat(indexPath, (err3, stat3) => {
        if (err3 || !stat3.isFile()) return serve404(res);
        streamFile(res, indexPath);
      });
    }
    if (err || !stat.isFile()) {
      // Nice URLs without .html, e.g. /destinations -> destinations.html
      const withHtml = filePath + ".html";
      return fs.stat(withHtml, (err2, stat2) => {
        if (err2 || !stat2.isFile()) return serve404(res);
        streamFile(res, withHtml);
      });
    }
    streamFile(res, filePath);
  });
}

function streamFile(res, filePath) {
  const ext = path.extname(filePath);
  res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
  fs.createReadStream(filePath).pipe(res);
}

function serve404(res) {
  const notFoundPath = path.join(PUBLIC_DIR, "404.html");
  fs.readFile(notFoundPath, (err, data) => {
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    res.end(err ? "404 Not Found" : data);
  });
}

const server = http.createServer((req, res) => {
  const ip = req.socket.remoteAddress || "unknown";
  if (req.url.startsWith("/api/")) {
    if (!rateLimit(ip)) {
      res.writeHead(429, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Too many requests" }));
    }
    return handleApi(req, res);
  }
  serveStatic(req, res, req.url.split("?")[0]);
});

server.listen(PORT, () => {
  console.log(`Skyward Airlines demo server running at http://localhost:${PORT}`);
  console.log(`Admin dashboard: http://localhost:${PORT}/admin  (token in config/site.config.js -> admin.demoToken)`);
});
