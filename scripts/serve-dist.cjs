/* Minimal static server for the built app (dist/) with SPA fallback.
   Usage: node scripts/serve-dist.cjs   (PORT env, default 8100) */
const http = require('http')
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..', 'dist')
const PORT = Number(process.env.PORT || 8100)

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
}

http
  .createServer((req, res) => {
    let urlPath = decodeURIComponent(req.url.split('?')[0])
    if (urlPath === '/') urlPath = '/index.html'
    const filePath = path.join(ROOT, urlPath)
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403)
      res.end('Forbidden')
      return
    }
    fs.readFile(filePath, (err, data) => {
      if (err) {
        fs.readFile(path.join(ROOT, 'index.html'), (err2, html) => {
          if (err2) {
            res.writeHead(404)
            res.end('Not found')
            return
          }
          res.writeHead(200, { 'Content-Type': MIME['.html'] })
          res.end(html)
        })
        return
      }
      const ext = path.extname(filePath).toLowerCase()
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' })
      res.end(data)
    })
  })
  .listen(PORT, '0.0.0.0', () => console.log(`smartsound dist on :${PORT}`))
