![logo](https://github.com/kaitoy/mcp-wireview/raw/master/logo/logo.png)

# MCP WireView

A VSCode extension for visualizing MCP (Model Context Protocol) messages with an interactive JSON viewer.

![screenshot](https://github.com/kaitoy/mcp-wireview/blob/master/mcp_wireview.gif)

## Features

- 🔌 **Connect to MCP Servers** - Configure and connect to remote MCP servers via HTTP
- 🎨 **Rich JSON Visualization** - Interactive JSON viewer powered by react-json-tree (same as Redux DevTools)
- 📡 **Real-time Streaming** - Full support for Server-Sent Events (SSE) streaming responses
- 🎯 **Session State Tracking** - Clear visual indicators for connection and initialization status
- 🌓 **Theme Integration** - Automatic adaptation to VSCode light/dark themes
- 📝 **Complete Protocol Support** - Initialize, list tools/prompts/resources, call tools, and custom requests

## Installation

### From VSIX (Local Development)

1. Download the `.vsix` file
2. Open VSCode
3. Go to Extensions view (`Ctrl+Shift+X`)
4. Click "..." menu → "Install from VSIX..."
5. Select the downloaded `.vsix` file

## Usage

### 1. Configure MCP Server URL

Set your MCP server URL via:

**Option A: Command Palette**
- Press `Ctrl+Shift+P`
- Run "MCP: Set Server URL"
- Enter your server URL (e.g., `http://localhost:3000/mcp`)

**Option B: Status Bar**
- Click the MCP status indicator in the status bar
- Enter your server URL

**Option C: Settings**
- Open Settings (`Ctrl+,`)
- Search for "MCP WireView"
- Set "MCP Client: Server Url"

### 2. Initialize Session

- Press `Ctrl+Shift+P`
- Run "MCP: Send Initialize Request"
- View the response in the interactive webview

### 3. Explore MCP Resources

**List available tools:**
```
Command: MCP: List Tools
```

**List available prompts:**
```
Command: MCP: List Prompts
```

**List available resources:**
```
Command: MCP: List Resources
```

### 4. Call a Tool

- Run "MCP: Call Tool"
- Enter tool name
- Enter arguments as JSON object (e.g., `{"param": "value"}`)
- View the response in the webview

### 5. Send Custom Requests

- Run "MCP: Send Custom JSON Request"
- Enter a JSON-RPC request:
  ```json
  {"method": "tools/list", "params": {}}
  ```

## Session States

The status bar displays the current MCP session state:

| State | Icon | Description |
|-------|------|-------------|
| **URL Not Set** | `$(debug-disconnect)` | No server URL configured |
| **Uninitialized** | `$(sync~spin)` | Server URL set but not initialized |
| **Initialized** | `$(check)` | Session initialized and ready |

## Commands

| Command | Description |
|---------|-------------|
| `MCP: Set Server URL` | Configure the MCP server URL |
| `MCP: Send Initialize Request` | Initialize the MCP session |
| `MCP: Uninitialize` | Reset the session (keeps URL) |
| `MCP: List Tools` | List available tools |
| `MCP: List Prompts` | List available prompts |
| `MCP: List Resources` | List available resources |
| `MCP: Call Tool` | Execute a tool with arguments |
| `MCP: Send Custom JSON Request` | Send a custom JSON-RPC request |

## Configuration

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `mcp.serverURL` | string | `""` | URL of the MCP server to connect to |

## Webview Features

The interactive webview provides:

- **Collapsible JSON nodes** - Click to expand/collapse objects and arrays
- **Syntax highlighting** - Color-coded JSON with VSCode theme integration
- **Request/Response display** - See both sides of the communication
- **SSE event visualization** - View all streaming events with event count
- **Error handling** - Clear error messages with context

## Development

### Prerequisites

- Node.js 20.x or higher
- npm

### Setup

```bash
# Install dependencies
npm install

# Install webview dependencies
npm run install:webview

# Compile
npm run compile
```

### Build Commands

```bash
# Compile both extension and webview
npm run compile

# Compile extension only
npm run compile:extension

# Compile webview only
npm run compile:webview

# Watch extension (auto-recompile on changes)
npm run watch

# Watch webview (Vite dev server)
npm run watch:webview
```

### Testing

1. Open this folder in VSCode
2. Press `F5` to launch Extension Development Host
3. In the new window, use the MCP commands
4. Open "MCP WireView" output channel for logs
5. Right-click webview → "Open Webview Developer Tools" for debugging

## Architecture

**Extension (TypeScript)**
- `src/extension.ts` - Entry point
- `src/commands.ts` - Command handlers
- `src/mcpClient.ts` - HTTP client with SSE support
- `src/responseViewer.ts` - Webview manager

**Webview UI (React + TypeScript)**
- `src/webview-ui/src/App.tsx` - Root component
- `src/webview-ui/src/components/` - UI components
- `src/webview-ui/src/theme/` - VSCode theme integration
- Build tool: Vite

## MCP Protocol Support

- Protocol Version: `2025-06-18`
- Transport: HTTP POST with JSON-RPC 2.0
- Streaming: Server-Sent Events (SSE)
- Capabilities: roots, sampling, elicitation

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Links

- [MCP Specification](https://spec.modelcontextprotocol.io/)
- [VSCode Extension API](https://code.visualstudio.com/api)
- [react-json-tree](https://github.com/reduxjs/redux-devtools/tree/main/packages/react-json-tree)
