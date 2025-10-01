# MinimaJS Examples

## Running the Examples

The examples use ES modules and need to be served from an HTTP server to work properly.

### Option 1: Using the Development Server

```bash
# From the project root
cd MinimaJS
python3 -m http.server 8000

# Then open in browser:
# http://localhost:8000/examples/getting-started.html
# http://localhost:8000/examples/llm-demo.html
# http://localhost:8000/examples/ultra-concise-demo.html
```

### Option 2: Using Node.js HTTP Server

```bash
# Install globally (if not already installed)
npm install -g http-server

# From the project root
http-server MinimaJS -p 8000

# Then open in browser:
# http://localhost:8000/examples/getting-started.html
```

### Option 3: Using Live Server (VS Code Extension)

If you're using VS Code, install the "Live Server" extension and right-click on any HTML file to open it with Live Server.

## Example Files

- **`getting-started.html`** - Complete introduction with counter, todo app, and LLM APIs
- **`llm-demo.html`** - Focuses on LLM-optimized APIs and fluent chain syntax
- **`ultra-concise-demo.html`** - Shows the shortest possible MinimaJS code

## Troubleshooting

**Error: "Failed to resolve module specifier"**
- Make sure you're serving the files from an HTTP server (not opening directly in browser)
- The examples import from `../dist/minima-full.min.js` which requires HTTP serving

**Error: "CORS policy"**
- Make sure you're serving from the correct directory
- The server should be running from the project root or MinimaJS directory
