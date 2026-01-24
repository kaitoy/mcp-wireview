// JSON-RPC 2.0 type definitions
export interface JSONRPCRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: any;
}

export interface JSONRPCResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: any;
  error?: JSONRPCError;
}

export interface JSONRPCError {
  code: number;
  message: string;
  data?: any;
}

// MCP protocol type definitions
export interface MCPClientInfo {
  name: string;
  version: string;
}

export interface MCPServerInfo {
  name: string;
  version: string;
}

export interface MCPCapabilities {
  roots?: {
    listChanged?: boolean;
  };
  sampling?: {};
  elicitation?: {};
}

export interface InitializeRequest {
  protocolVersion: string;
  capabilities: MCPCapabilities;
  clientInfo: MCPClientInfo;
}

export interface InitializeResult {
  protocolVersion: string;
  capabilities: MCPCapabilities;
  serverInfo: MCPServerInfo;
}

// Tool type definitions
export interface MCPTool {
  name: string;
  description?: string;
  inputSchema: {
    type: 'object';
    properties?: Record<string, any>;
    required?: string[];
  };
}

export interface ListToolsResult {
  tools: MCPTool[];
}

export interface CallToolRequest {
  name: string;
  arguments?: Record<string, any>;
}

export interface CallToolResult {
  content: Array<{
    type: string;
    text?: string;
    [key: string]: any;
  }>;
  isError?: boolean;
}

// Prompt type definitions
export interface MCPPrompt {
  name: string;
  description?: string;
  arguments?: Array<{
    name: string;
    description?: string;
    required?: boolean;
  }>;
}

export interface ListPromptsResult {
  prompts: MCPPrompt[];
}

// Resource type definitions
export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface ListResourcesResult {
  resources: MCPResource[];
}

// HTTP Headers type definitions
export interface HTTPHeaders {
  [key: string]: string;
}

export interface HTTPInfo {
  requestHeaders: HTTPHeaders;
  responseHeaders: HTTPHeaders;
}
