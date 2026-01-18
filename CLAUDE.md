# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MCP WireView** is a VSCode extension for visualizing MCP (Model Context Protocol) messages with an interactive JSON viewer. It allows users to connect to remote MCP servers via HTTP and send JSON-RPC 2.0 requests to interact with tools, prompts, and resources exposed by the server. All responses are displayed in a React-based webview with rich JSON visualization powered by react-json-tree.

## Build and Development Commands

```bash
# Compile both extension and webview (outputs to ./out directory)
npm run compile

# Compile extension only
npm run compile:extension

# Compile webview only
npm run compile:webview

# Watch mode for extension development (recompiles on file changes)
npm run watch

# Watch mode for webview development (with Vite dev server)
npm run watch:webview

# Install webview dependencies
npm run install:webview

# Run linting
npm run lint

# Run tests (compiles and lints first)
npm run pretest

# Prepare for publishing (production build)
npm run vscode:prepublish
```

## Architecture

### Core Components

**src/extension.ts** - VSCode extension entry point
- `activate()` function initializes the extension
- Creates output channel for displaying MCP responses
- Creates status bar item for showing connection status
- Registers all MCP commands with VSCode command palette

**src/mcpClient.ts** - HTTP-based MCP client implementation
- Manages connection state to a single MCP server URL
- Sends JSON-RPC 2.0 requests via HTTP POST with fetch API
- Supports both structured requests (`sendRequest()`) and custom JSON requests (`sendCustomRequest()`)
- Auto-increments request IDs for each request

**src/commands.ts** - Command handlers for VSCode commands
- `MCPCommands` class encapsulates all command logic
- Manages UI interactions (input boxes, status bar updates)
- Displays responses in output channel
- Available commands:
  - Connect/disconnect to MCP server
  - Initialize protocol handshake
  - List tools, prompts, and resources
  - Call tools with arguments
  - Send custom JSON-RPC requests

**src/types.ts** - TypeScript type definitions
- JSON-RPC 2.0 protocol types (request, response, error)
- MCP protocol types (initialize, capabilities, client/server info)
- MCP entity types (tools, prompts, resources)

**src/responseViewer.ts** - Webview panel for displaying responses
- Creates and manages a VSCode WebviewPanel
- Loads React-based webview UI built with Vite
- Passes data to webview via `window.initialData`
- Supports both standard responses and SSE streaming events

### Webview UI (React + Vite + TypeScript)

The extension uses a React-based webview UI for displaying MCP responses with rich JSON visualization.

**Structure:**
- `src/webview-ui/` - React application source code
- `out/webview/` - Vite build output (bundled for production)

**Key Components:**
- `App.tsx` - Root component, receives data via `window.initialData`
- `ResponseSection.tsx` - Reusable section container for requests/responses
- `EventList.tsx` - SSE event stream display with individual event items
- `ErrorBlock.tsx` - Error message display
- `theme/jsonTreeTheme.ts` - VSCode theme configuration for react-json-tree

**JSON Rendering:**
Uses `react-json-tree` library (same as Redux DevTools) for interactive JSON display:
- Collapsible/expandable object and array nodes
- Syntax highlighting matching VSCode theme colors
- Automatic theme adaptation (light/dark mode)

**Build Process:**
1. Extension code: `tsc -p ./` → `out/*.js`
2. Webview UI: Vite build → `out/webview/` (index.html, bundled assets)

**Development Workflow:**
```bash
# Terminal 1: Watch extension code
npm run watch

# Terminal 2: Watch webview with Vite dev server (optional)
npm run watch:webview
```

### Key Design Patterns

**Stateful Connection**: The extension maintains connection state to exactly one MCP server at a time. Connection URL is stored in `MCPClient` and can be changed via the "Connect to Server" command.

**HTTP-based Protocol with SSE Support**: This client communicates with MCP servers over HTTP POST requests. It supports both:
- Standard JSON responses (single response per request)
- Server-Sent Events (SSE) streaming responses (multiple events per request)

The client automatically detects the response type based on the `Content-Type` header and processes accordingly.

**SSE Stream Handling**: When a server returns `text/event-stream`, the client:
- Reads the ReadableStream chunk by chunk
- Parses each `data:` line as a JSON-RPC response
- Invokes an optional callback for each event (enables real-time progress display)
- Returns the last received response as the final result
- Handles `[DONE]` markers to detect stream completion

**Output Channel Display**: All MCP responses are displayed in the "MCP Client" output channel rather than inline in the editor. For SSE streams, each event is displayed in real-time as it arrives, followed by a summary showing the total event count.

**Status Bar Integration**: Connection status is always visible in the VSCode status bar, with icons indicating connected (`$(plug)`) or disconnected (`$(debug-disconnect)`) state.

## MCP Protocol Implementation

The extension implements MCP protocol version "2025-06-18" with the following capabilities declared during initialization:
- `roots`: Directory/workspace roots support
- `sampling`: LLM sampling support
- `elicitation`: Prompt elicitation support

Standard MCP methods supported:
- `initialize` - Protocol handshake
- `tools/list` - List available tools
- `tools/call` - Execute a tool with arguments
- `prompts/list` - List available prompts
- `resources/list` - List available resources

## Testing the Extension

To test the extension in development:
1. Open this folder in VSCode
2. Press F5 to launch Extension Development Host
3. In the new VSCode window, use Command Palette (Ctrl+Shift+P) to access MCP commands
4. Connect to a running MCP server (e.g., http://localhost:3000/mcp)
5. Send requests and view responses in the "MCP Client" output channel
