#!/usr/bin/env node

/**
 * MinimaJS Development Server
 * 
 * A lightweight development server with:
 * - Static file serving
 * - Hot reload via WebSocket
 * - File watching
 * - SPA routing support
 * 
 * Zero external dependencies - uses only Node.js built-ins
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');

// Server configuration
const CONFIG = {
  port: process.env.PORT || 8080,
  host: process.env.HOST || 'localhost',
  watchDirs: ['./src', './examples', './'],
  excludePatterns: [/node_modules/, /\.git/, /\.DS_Store/, /\.log$/, /\.tmp$/],
  indexFile: 'index.html'
};

// MIME types for common files
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.md': 'text/markdown',
  '.txt': 'text/plain',
  '.xml': 'application/xml',
  '.pdf': 'application/pdf',
  '.zip': 'application/zip',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject'
};

// =========================================================================
// WEBSOCKET SERVER (Minimal implementation)
// =========================================================================

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
      } else {
        socket.destroy();
      }
    });
  }
  
  handleWebSocketUpgrade(request, socket, head) {
    try {
      // WebSocket handshake
      const key = request.headers['sec-websocket-key'];
      if (!key) {
        socket.destroy();
        return;
      }
      
      const acceptKey = this.generateAcceptKey(key);
      
      const responseHeaders = [
        'HTTP/1.1 101 Switching Protocols',
        'Upgrade: websocket',
        'Connection: Upgrade',
        `Sec-WebSocket-Accept: ${acceptKey}`,
        '', ''
      ].join('\r\n');
      
      socket.write(responseHeaders);
      
      const client = { 
        socket, 
        id: Date.now() + Math.random(),
        connected: true
      };
      
      this.clients.add(client);
      console.log(`📡 WebSocket client connected (${this.clients.size} total)`);
      
      socket.on('close', () => {
        client.connected = false;
        this.clients.delete(client);
        console.log(`📡 WebSocket client disconnected (${this.clients.size} remaining)`);
      });
      
      socket.on('error', (error) => {
        console.error('WebSocket error:', error.message);
        client.connected = false;
        this.clients.delete(client);
      });
      
      // Send welcome message
      this.sendToClient(client, {
        type: 'connection',
        message: 'MinimaJS dev server connected'
      });
      
    } catch (error) {
      console.error('WebSocket upgrade error:', error);
      socket.destroy();
    }
  }
  
  generateAcceptKey(key) {
    const magicString = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
    return crypto
      .createHash('sha1')
      .update(key + magicString)
      .digest('base64');
  }
  
  sendToClient(client, message) {
    if (!client.connected) return;
    
    try {
      const frame = this.createWebSocketFrame(JSON.stringify(message));
      client.socket.write(frame);
    } catch (error) {
      console.error('Error sending to WebSocket client:', error.message);
      client.connected = false;
      this.clients.delete(client);
    }
  }
  
  broadcast(message) {
    const deadClients = [];
    
    this.clients.forEach(client => {
      if (client.connected) {
        this.sendToClient(client, message);
      } else {
        deadClients.push(client);
      }
    });
    
    // Clean up dead clients
    deadClients.forEach(client => this.clients.delete(client));
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

// =========================================================================
// FILE WATCHER
// =========================================================================

class FileWatcher {
  constructor(websocket) {
    this.websocket = websocket;
    this.watchers = new Map();
    this.debounceTimers = new Map();
    this.debounceDelay = 100; // ms
  }
  
  start() {
    console.log('📁 Starting file watchers...');
    
    CONFIG.watchDirs.forEach(dir => {
      this.watchDirectory(dir);
    });
    
    console.log(`📁 Watching ${this.watchers.size} directories for changes`);
  }
  
  watchDirectory(dirPath) {
    const resolvedPath = path.resolve(dirPath);
    
    if (!fs.existsSync(resolvedPath)) {
      console.warn(`⚠️  Directory not found: ${dirPath}`);
      return;
    }
    
    try {
      const watcher = fs.watch(resolvedPath, { recursive: true }, (eventType, filename) => {
        if (filename && this.shouldWatch(filename)) {
          const fullPath = path.join(resolvedPath, filename);
          this.handleFileChange(fullPath, eventType);
        }
      });
      
      this.watchers.set(dirPath, watcher);
      console.log(`📁 Watching: ${dirPath}`);
      
    } catch (error) {
      console.error(`❌ Error watching ${dirPath}:`, error.message);
    }
  }
  
  shouldWatch(filename) {
    return !CONFIG.excludePatterns.some(pattern => pattern.test(filename));
  }
  
  handleFileChange(filePath, eventType) {
    const debounceKey = filePath;
    
    // Clear existing timer for this file
    if (this.debounceTimers.has(debounceKey)) {
      clearTimeout(this.debounceTimers.get(debounceKey));
    }
    
    // Set new timer
    this.debounceTimers.set(debounceKey, setTimeout(() => {
      const relativePath = path.relative(process.cwd(), filePath);
      console.log(`📝 File ${eventType}: ${relativePath}`);
      
      // Broadcast change to connected clients
      this.websocket.broadcast({
        type: 'file-changed',
        file: relativePath,
        eventType: eventType,
        timestamp: Date.now()
      });
      
      this.debounceTimers.delete(debounceKey);
    }, this.debounceDelay));
  }
  
  stop() {
    console.log('🛑 Stopping file watchers...');
    
    this.watchers.forEach(watcher => {
      try {
        watcher.close();
      } catch (error) {
        console.error('Error closing watcher:', error.message);
      }
    });
    
    this.watchers.clear();
    
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
  }
}

// =========================================================================
// HTTP SERVER
// =========================================================================

class DevServer {
  constructor() {
    this.server = http.createServer((req, res) => this.handleRequest(req, res));
    this.websocket = new SimpleWebSocket(this.server);
    this.fileWatcher = new FileWatcher(this.websocket);
    this.requestCount = 0;
  }
  
  start() {
    this.server.listen(CONFIG.port, CONFIG.host, () => {
      console.log('🚀 MinimaJS Development Server');
      console.log(`📍 Server running at http://${CONFIG.host}:${CONFIG.port}`);
      console.log(`📡 WebSocket ready for hot-reload connections`);
      console.log(`📁 Serving files from: ${process.cwd()}`);
      console.log('');
      console.log('Press Ctrl+C to stop');
    });
    
    this.fileWatcher.start();
    
    // Graceful shutdown handlers
    process.on('SIGINT', () => this.stop());
    process.on('SIGTERM', () => this.stop());
    
    // Error handling
    this.server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${CONFIG.port} is already in use`);
        console.error('💡 Try a different port: PORT=3000 node start-dev.js');
      } else {
        console.error('❌ Server error:', error.message);
      }
      process.exit(1);
    });
  }
  
  stop() {
    console.log('\n🛑 Shutting down dev server...');
    
    this.fileWatcher.stop();
    
    this.server.close(() => {
      console.log('✅ Server stopped gracefully');
      process.exit(0);
    });
    
    // Force exit after 5 seconds
    setTimeout(() => {
      console.log('🔴 Force stopping server');
      process.exit(1);
    }, 5000);
  }
  
  handleRequest(req, res) {
    this.requestCount++;
    
    try {
      const parsedUrl = url.parse(req.url);
      const pathname = decodeURIComponent(parsedUrl.pathname);
      
      console.log(`📥 ${req.method} ${pathname}`);
      
      // Handle special routes
      if (pathname === '/health') {
        this.sendJSON(res, { 
          status: 'ok', 
          uptime: process.uptime(),
          requests: this.requestCount 
        });
        return;
      }
      
      // Determine file path
      let filePath = path.join(process.cwd(), pathname);
      
      // Handle directory requests and SPA fallback
      if (!fs.existsSync(filePath) || (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory())) {
        filePath = this.findIndexFile(filePath, pathname);
      }
      
      // Security check - prevent directory traversal
      const resolvedPath = path.resolve(filePath);
      const basePath = path.resolve(process.cwd());
      
      if (!resolvedPath.startsWith(basePath)) {
        this.send403(res, 'Access denied');
        return;
      }
      
      this.serveFile(filePath, res);
      
    } catch (error) {
      console.error('❌ Request handling error:', error);
      this.send500(res, error);
    }
  }
  
  findIndexFile(originalPath, pathname) {
    // Try directory index file
    if (fs.existsSync(originalPath) && fs.statSync(originalPath).isDirectory()) {
      const indexPath = path.join(originalPath, CONFIG.indexFile);
      if (fs.existsSync(indexPath)) {
        return indexPath;
      }
    }
    
    // SPA fallback - look for index.html in parent directories
    let currentDir = originalPath;
    
    while (currentDir !== path.dirname(currentDir)) {
      currentDir = path.dirname(currentDir);
      const indexPath = path.join(currentDir, CONFIG.indexFile);
      
      if (fs.existsSync(indexPath)) {
        return indexPath;
      }
    }
    
    // Final fallback - root index.html
    const rootIndex = path.join(process.cwd(), CONFIG.indexFile);
    return fs.existsSync(rootIndex) ? rootIndex : originalPath;
  }
  
  serveFile(filePath, res) {
    fs.readFile(filePath, (error, content) => {
      if (error) {
        if (error.code === 'ENOENT') {
          this.send404(res, filePath);
        } else if (error.code === 'EACCES') {
          this.send403(res, 'Permission denied');
        } else {
          this.send500(res, error);
        }
        return;
      }
      
      const ext = path.extname(filePath).toLowerCase();
      const mimeType = MIME_TYPES[ext] || 'application/octet-stream';
      
      // Set response headers
      res.writeHead(200, {
        'Content-Type': mimeType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
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
    <!-- MinimaJS Hot Reload Script -->
    <script>
      (function() {
        let ws;
        let reconnectAttempts = 0;
        const maxReconnectAttempts = 5;
        
        function connect() {
          ws = new WebSocket('ws://${CONFIG.host}:${CONFIG.port}/ws');
          
          ws.onopen = function() {
            console.log('🔥 MinimaJS Hot Reload connected');
            reconnectAttempts = 0;
          };
          
          ws.onmessage = function(event) {
            try {
              const data = JSON.parse(event.data);
              
              if (data.type === 'file-changed') {
                console.log('♻️ File changed, reloading:', data.file);
                
                // Small delay to ensure file is fully written
                setTimeout(() => {
                  window.location.reload();
                }, 100);
              }
            } catch (error) {
              console.error('Hot reload message error:', error);
            }
          };
          
          ws.onclose = function() {
            console.log('❌ Hot reload disconnected');
            
            // Attempt to reconnect
            if (reconnectAttempts < maxReconnectAttempts) {
              reconnectAttempts++;
              console.log(\`🔄 Attempting to reconnect (\${reconnectAttempts}/\${maxReconnectAttempts})...\`);
              setTimeout(connect, 2000 * reconnectAttempts);
            } else {
              console.log('💔 Hot reload connection failed after multiple attempts');
            }
          };
          
          ws.onerror = function(error) {
            console.error('❌ Hot reload connection error:', error);
          };
        }
        
        // Initial connection
        connect();
        
        // Expose reconnect function globally
        window.reconnectHotReload = connect;
      })();
    </script>
    `;
    
    const htmlStr = htmlContent.toString();
    
    // Try to inject before closing body tag
    if (htmlStr.includes('</body>')) {
      return htmlStr.replace('</body>', hotReloadScript + '\n  </body>');
    }
    
    // Try to inject before closing html tag
    if (htmlStr.includes('</html>')) {
      return htmlStr.replace('</html>', hotReloadScript + '\n</html>');
    }
    
    // Fallback - append to end
    return htmlStr + hotReloadScript;
  }
  
  send404(res, filePath) {
    const relativePath = path.relative(process.cwd(), filePath);
    console.log(`❌ 404: ${relativePath}`);
    
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>404 - Not Found</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            .error { color: #d32f2f; }
            .path { background: #f5f5f5; padding: 10px; border-radius: 4px; font-family: monospace; }
          </style>
        </head>
        <body>
          <h1 class="error">404 - Not Found</h1>
          <p>The requested file was not found:</p>
          <div class="path">${relativePath}</div>
          <p><a href="/">← Go to home</a></p>
          <hr>
          <small>MinimaJS Development Server</small>
        </body>
      </html>
    `);
  }
  
  send403(res, message) {
    console.log(`❌ 403: ${message}`);
    
    res.writeHead(403, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
        <head><title>403 - Forbidden</title></head>
        <body>
          <h1>403 - Forbidden</h1>
          <p>${message}</p>
          <hr>
          <small>MinimaJS Development Server</small>
        </body>
      </html>
    `);
  }
  
  send500(res, error) {
    console.error('❌ 500:', error.message);
    
    res.writeHead(500, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
        <head><title>500 - Server Error</title></head>
        <body>
          <h1>500 - Server Error</h1>
          <p>${error.message}</p>
          <hr>
          <small>MinimaJS Development Server</small>
        </body>
      </html>
    `);
  }
  
  sendJSON(res, data) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data, null, 2));
  }
}

// =========================================================================
// MAIN EXECUTION
// =========================================================================

if (require.main === module) {
  console.log('🔧 MinimaJS Development Server Starting...\n');
  
  const server = new DevServer();
  server.start();
}

module.exports = DevServer;