# Development Server Implementation Guide 🛠️

**OPTIMIZED FOR CLAUDE-4-SONNET CODING**

This document provides exact implementation specifications for the `start-dev.js` development server. All code patterns are designed for direct AI implementation with Node.js built-in modules only.

-----

## `start-dev.js` - EXACT IMPLEMENTATION

### 1\. Introduction

The `start-dev.js` script is a crucial, self-contained component of the MinimaJS development workflow. Its sole purpose is to provide a **local development environment** for MinimaJS applications without relying on external build tools or complex configurations. It acts as a lightweight server that serves application files, monitors for changes, and facilitates hot-reloading and runtime type-checking feedback through a WebSocket connection. This script is designed to be run directly with Node.js and is **never included in production deployments**.

-----

### 2\. Complete Server Implementation

```javascript
// EXACT implementation for start-dev.js
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');

// Server configuration
const CONFIG = {
  port: 8080,
  host: 'localhost',
  watchDirs: ['./src', './examples'],
  excludePatterns: [/node_modules/, /\.git/, /\.DS_Store/]
};

// MIME types for common files
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.md': 'text/markdown'
};

// WebSocket implementation (minimal, no external dependencies)
class SimpleWebSocket {
  constructor(server) {
    this.clients = new Set();
    this.server = server;
    this.setupWebSocketServer();
  }
  
  setupWebSocketServer() {
    this.server.on('upgrade', (request, socket, head) => {
      if (request.url === '/ws') {
        this.handleWebSocketUpgrade(request, socket, head);
      }
    });
  }
  
  handleWebSocketUpgrade(request, socket, head) {
    // Simplified WebSocket handshake
    const acceptKey = this.generateAcceptKey(request.headers['sec-websocket-key']);
    
    const responseHeaders = [
      'HTTP/1.1 101 Switching Protocols',
      'Upgrade: websocket',
      'Connection: Upgrade',
      `Sec-WebSocket-Accept: ${acceptKey}`,
      '', ''
    ].join('\r\n');
    
    socket.write(responseHeaders);
    
    const client = { socket, id: Date.now() };
    this.clients.add(client);
    
    socket.on('close', () => {
      this.clients.delete(client);
    });
    
    socket.on('error', () => {
      this.clients.delete(client);
    });
  }
  
  generateAcceptKey(key) {
    const magicString = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
    return crypto
      .createHash('sha1')
      .update(key + magicString)
      .digest('base64');
  }
  
  broadcast(message) {
    const frame = this.createWebSocketFrame(JSON.stringify(message));
    
    this.clients.forEach(client => {
      try {
        client.socket.write(frame);
      } catch (error) {
        this.clients.delete(client);
      }
    });
  }
  
  createWebSocketFrame(payload) {
    const payloadBuffer = Buffer.from(payload, 'utf8');
    const payloadLength = payloadBuffer.length;
    
    let frame;
    if (payloadLength < 126) {
      frame = Buffer.allocUnsafe(2 + payloadLength);
      frame[0] = 0x81; // FIN = 1, opcode = 1 (text)
      frame[1] = payloadLength;
      payloadBuffer.copy(frame, 2);
    } else if (payloadLength < 65536) {
      frame = Buffer.allocUnsafe(4 + payloadLength);
      frame[0] = 0x81;
      frame[1] = 126;
      frame.writeUInt16BE(payloadLength, 2);
      payloadBuffer.copy(frame, 4);
    } else {
      frame = Buffer.allocUnsafe(10 + payloadLength);
      frame[0] = 0x81;
      frame[1] = 127;
      frame.writeUInt32BE(0, 2);
      frame.writeUInt32BE(payloadLength, 6);
      payloadBuffer.copy(frame, 10);
    }
    
    return frame;
  }
}

// File watcher implementation
class FileWatcher {
  constructor(websocket) {
    this.websocket = websocket;
    this.watchers = new Map();
    this.debounceTimers = new Map();
  }
  
  start() {
    CONFIG.watchDirs.forEach(dir => {
      this.watchDirectory(dir);
    });
  }
  
  watchDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) return;
    
    try {
      const watcher = fs.watch(dirPath, { recursive: true }, (eventType, filename) => {
        if (filename && this.shouldWatch(filename)) {
          this.handleFileChange(path.join(dirPath, filename), eventType);
        }
      });
      
      this.watchers.set(dirPath, watcher);
      console.log(`📁 Watching: ${dirPath}`);
    } catch (error) {
      console.error(`Error watching ${dirPath}:`, error.message);
    }
  }
  
  shouldWatch(filename) {
    return !CONFIG.excludePatterns.some(pattern => pattern.test(filename));
  }
  
  handleFileChange(filePath, eventType) {
    // Debounce rapid file changes
    const debounceKey = filePath;
    
    if (this.debounceTimers.has(debounceKey)) {
      clearTimeout(this.debounceTimers.get(debounceKey));
    }
    
    this.debounceTimers.set(debounceKey, setTimeout(() => {
      console.log(`📝 File ${eventType}: ${filePath}`);
      
      this.websocket.broadcast({
        type: 'file-changed',
        file: filePath,
        eventType: eventType,
        timestamp: Date.now()
      });
      
      this.debounceTimers.delete(debounceKey);
    }, 100));
  }
  
  stop() {
    this.watchers.forEach(watcher => watcher.close());
    this.watchers.clear();
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
  }
}

// HTTP server implementation
class DevServer {
  constructor() {
    this.server = http.createServer((req, res) => this.handleRequest(req, res));
    this.websocket = new SimpleWebSocket(this.server);
    this.fileWatcher = new FileWatcher(this.websocket);
  }
  
  start() {
    this.server.listen(CONFIG.port, CONFIG.host, () => {
      console.log(`🚀 MinimaJS Dev Server running at http://${CONFIG.host}:${CONFIG.port}`);
      console.log(`📡 WebSocket server ready for hot-reload connections`);
    });
    
    this.fileWatcher.start();
    
    // Graceful shutdown
    process.on('SIGINT', () => this.stop());
    process.on('SIGTERM', () => this.stop());
  }
  
  stop() {
    console.log('\n🛑 Shutting down dev server...');
    this.fileWatcher.stop();
    this.server.close(() => {
      console.log('✅ Server stopped');
      process.exit(0);
    });
  }
  
  handleRequest(req, res) {
    const parsedUrl = url.parse(req.url);
    let filePath = path.join(process.cwd(), parsedUrl.pathname);
    
    // SPA fallback - serve index.html for unknown routes
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      const indexPath = path.join(path.dirname(filePath), 'index.html');
      if (fs.existsSync(indexPath)) {
        filePath = indexPath;
      } else {
        filePath = path.join(process.cwd(), 'index.html');
      }
    }
    
    this.serveFile(filePath, res);
  }
  
  serveFile(filePath, res) {
    fs.readFile(filePath, (error, content) => {
      if (error) {
        if (error.code === 'ENOENT') {
          this.send404(res);
        } else {
          this.send500(res, error);
        }
        return;
      }
      
      const ext = path.extname(filePath);
      const mimeType = MIME_TYPES[ext] || 'application/octet-stream';
      
      res.writeHead(200, {
        'Content-Type': mimeType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache'
      });
      
      // Inject hot-reload script into HTML files
      if (ext === '.html') {
        content = this.injectHotReload(content);
      }
      
      res.end(content);
    });
  }
  
  injectHotReload(htmlContent) {
    const hotReloadScript = `
      <script>
        (function() {
          const ws = new WebSocket('ws://localhost:${CONFIG.port}/ws');
          
          ws.onopen = function() {
            console.log('🔥 Hot reload connected');
          };
          
          ws.onmessage = function(event) {
            const data = JSON.parse(event.data);
            if (data.type === 'file-changed') {
              console.log('♻️ File changed, reloading:', data.file);
              window.location.reload();
            }
          };
          
          ws.onclose = function() {
            console.log('❌ Hot reload disconnected');
          };
        })();
      </script>
    `;
    
    return htmlContent.toString().replace('</body>', hotReloadScript + '</body>');
  }
  
  send404(res) {
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end(`
      <html>
        <body>
          <h1>404 - Not Found</h1>
          <p>The requested file was not found.</p>
        </body>
      </html>
    `);
  }
  
  send500(res, error) {
    res.writeHead(500, { 'Content-Type': 'text/html' });
    res.end(`
      <html>
        <body>
          <h1>500 - Server Error</h1>
          <p>${error.message}</p>
        </body>
      </html>
    `);
  }
}

// Start the server
if (require.main === module) {
  const server = new DevServer();
  server.start();
}

module.exports = DevServer;
```

-----

### 3\. Interaction with MinimaJS Application

The `start-dev.js` script works in tandem with the `minima.dev.js` file loaded in the browser.

  * **Serving `minima.dev.js`**: The `start-dev.js` server serves the `minima.dev.js` file alongside the application's main `index.html` and component files.
  * **WebSocket Handshake**: When `minima.dev.js` loads in the browser, it automatically attempts to establish a WebSocket connection back to the `start-dev.js` server.
  * **Hot Reloading Trigger**: Upon receiving a file change notification from `start-dev.js`, the `minima.dev.js` in the browser takes over, fetching the updated module and performing the in-memory replacement and re-render.
  * **Runtime Type-Checking Feedback**: While `minima.dev.js` performs the actual runtime type checks, `start-dev.js` could optionally log these errors on the server-side console as well, providing a centralized view of development issues.

-----

### 4\. Technical Details

  * **Runtime**: Node.js (minimal version requirement, e.g., Node.js 14+ for modern `fs` and `http` features).
  * **Core Modules**: Primarily uses Node.js's built-in `http`, `fs`, and potentially `path` modules. A simple WebSocket server can be implemented using the `ws` package or a custom, minimal WebSocket handler.
  * **Configuration**: A small, optional configuration object could allow specifying the port, watched directories, and excluded files.

-----

### 5\. Usage

Developers would typically run `start-dev.js` from their terminal:

```bash
node start-dev.js
```

This command would launch the local server, making the application accessible in the browser (e.g., `http://localhost:8080`). As developers make changes to their MinimaJS components or other files, the browser would automatically hot-reload the changes, providing a rapid feedback loop.