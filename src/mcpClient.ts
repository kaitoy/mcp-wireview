import { randomUUID } from 'crypto';
import { JSONRPCRequest, JSONRPCResponse } from './types';

export class MCPClient {
  private serverURL: string | null = null;
  private initializeRequestId: string | number | null = null;
  private protocolVersion: string | null = null;
  private sessionId: string | null = null;
  private customHeaders: Record<string, string> = {};

  isConnected(): boolean {
    return this.serverURL !== null;
  }

  isInitialized(): boolean {
    return this.protocolVersion !== null;
  }

  getserverURL(): string | null {
    return this.serverURL;
  }

  connect(url: string): void {
    this.serverURL = url;
  }

  setCustomHeaders(headers: Record<string, string>): void {
    this.customHeaders = { ...headers };
  }

  getCustomHeaders(): Record<string, string> {
    return { ...this.customHeaders };
  }

  uninitialize(): void {
    this.initializeRequestId = null;
    this.protocolVersion = null;
    this.sessionId = null;
  }

  disconnect(): void {
    this.serverURL = null;
    this.initializeRequestId = null;
    this.protocolVersion = null;
    this.sessionId = null;
  }

  async sendNotification(method: string, params?: any): Promise<void> {
    if (!this.serverURL) {
      throw new Error('Not connected to any server. Please connect first.');
    }

    const notification = {
      jsonrpc: '2.0',
      method,
      ...(params !== undefined && Object.keys(params).length > 0 ? { params } : {})
    };

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
        ...this.customHeaders, // Add custom headers
      };

      // Include protocolVersion in headers if set (except for notifications/initialized)
      if (this.protocolVersion && method !== 'notifications/initialized') {
        headers['MCP-Protocol-Version'] = this.protocolVersion;
      }

      // Include sessionId in headers if set
      if (this.sessionId) {
        headers['Mcp-Session-Id'] = this.sessionId;
      }

      const response = await fetch(this.serverURL, {
        method: 'POST',
        headers,
        body: JSON.stringify(notification),
      });

      if (!response.ok) {
        let errorBody = '';
        try {
          errorBody = await response.text();
        } catch (e) {
          // Ignore error reading body
        }
        throw new Error(`HTTP error! status: ${response.status} ${response.statusText}${errorBody ? `\nResponse body: ${errorBody}` : ''}`);
      }

      // Notifications do not expect a response, but we verify the HTTP response
    } catch (error) {
      throw new Error(`Failed to send notification: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async sendRequest(
    method: string,
    params?: any,
    onEvent?: (response: JSONRPCResponse) => void,
    requestId?: string | number,
    onBeforeSend?: (request: JSONRPCRequest) => void
  ): Promise<JSONRPCResponse> {
    if (!this.serverURL) {
      throw new Error('Not connected to any server. Please connect first.');
    }

    let id: string | number;

    if (method === 'initialize') {
      id = requestId !== undefined ? requestId : randomUUID();
      this.initializeRequestId = id;
    } else {
      if (this.initializeRequestId !== null) {
        id = this.initializeRequestId;
      } else {
        id = requestId !== undefined ? requestId : randomUUID();
      }
    }

    const request: JSONRPCRequest = {
      jsonrpc: '2.0',
      id,
      method,
      ...(params !== undefined && Object.keys(params).length > 0 ? { params } : {})
    };

    if (onBeforeSend) {
      onBeforeSend(request);
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
        ...this.customHeaders, // Add custom headers
      };

      // Include protocolVersion and sessionId in headers after initialize request
      if (method !== 'initialize') {
        if (this.protocolVersion) {
          headers['MCP-Protocol-Version'] = this.protocolVersion;
        }
        if (this.sessionId) {
          headers['Mcp-Session-Id'] = this.sessionId;
        }
      }

      const response = await fetch(this.serverURL, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        let errorBody = '';
        try {
          errorBody = await response.text();
        } catch (e) {
          // Ignore error reading body
        }
        throw new Error(`HTTP error! status: ${response.status} ${response.statusText}${errorBody ? `\nResponse body: ${errorBody}` : ''}`);
      }

      const contentType = response.headers.get('content-type');

      let result: JSONRPCResponse;

      if (contentType?.includes('text/event-stream')) {
        result = await this.handleSSEResponse(response, onEvent);
      } else {
        result = await response.json() as JSONRPCResponse;
        if (onEvent) {
          onEvent(result);
        }
      }

      // If initialize succeeds, save protocolVersion and sessionId, then send notifications/initialized
      if (method === 'initialize' && !result.error) {
        if (result.result?.protocolVersion) {
          this.protocolVersion = result.result.protocolVersion;
        }
        const sessionId = response.headers.get('Mcp-Session-Id');
        if (sessionId) {
          this.sessionId = sessionId;
        }
        await this.sendNotification('notifications/initialized');
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to send request: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async handleSSEResponse(
    response: Response,
    onEvent?: (response: JSONRPCResponse) => void
  ): Promise<JSONRPCResponse> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let lastResponse: JSONRPCResponse | null = null;

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');

        // Keep the last line as it may be incomplete
        buffer = lines.pop() || '';

        for (const line of lines) {
          // Process SSE format: "data: {...}" lines
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();

            if (data === '[DONE]') {
              // Stream end marker
              continue;
            }

            try {
              const jsonResponse = JSON.parse(data) as JSONRPCResponse;
              lastResponse = jsonResponse;

              if (onEvent) {
                onEvent(jsonResponse);
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', data, e);
            }
          }
        }
      }

      // Process any remaining data in the buffer
      if (buffer.trim() && buffer.startsWith('data: ')) {
        const data = buffer.slice(6).trim();
        if (data !== '[DONE]') {
          try {
            const jsonResponse = JSON.parse(data) as JSONRPCResponse;
            lastResponse = jsonResponse;

            if (onEvent) {
              onEvent(jsonResponse);
            }
          } catch (e) {
            console.error('Failed to parse final SSE data:', data, e);
          }
        }
      }

      if (!lastResponse) {
        throw new Error('No valid response received from SSE stream');
      }

      return lastResponse;
    } finally {
      reader.releaseLock();
    }
  }

  async sendCustomRequest(jsonString: string): Promise<JSONRPCResponse> {
    if (!this.serverURL) {
      throw new Error('Not connected to any server. Please connect first.');
    }

    try {
      const request = JSON.parse(jsonString);

      if (!request.jsonrpc) {
        request.jsonrpc = '2.0';
      }
      if (!request.id) {
        request.id = randomUUID();
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...this.customHeaders, // Add custom headers
      };

      // Include protocolVersion in headers if set
      if (this.protocolVersion) {
        headers['MCP-Protocol-Version'] = this.protocolVersion;
      }

      // Include sessionId in headers if set
      if (this.sessionId) {
        headers['Mcp-Session-Id'] = this.sessionId;
      }

      const response = await fetch(this.serverURL, {
        method: 'POST',
        headers,
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        let errorBody = '';
        try {
          errorBody = await response.text();
        } catch (e) {
          // Ignore error reading body
        }
        throw new Error(`HTTP error! status: ${response.status} ${response.statusText}${errorBody ? `\nResponse body: ${errorBody}` : ''}`);
      }

      const result = await response.json() as JSONRPCResponse;
      return result;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON: ${error.message}`);
      }
      throw new Error(`Failed to send request: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
