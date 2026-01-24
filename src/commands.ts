import * as vscode from 'vscode';
import { MCPClient } from './mcpClient';
import { InitializeRequest } from './types';
import { ResponseViewer } from './responseViewer';

export class MCPCommands {
  private client: MCPClient;
  private outputChannel: vscode.OutputChannel;
  private statusBarItem: vscode.StatusBarItem;
  private responseViewer: ResponseViewer;

  constructor(
    client: MCPClient,
    outputChannel: vscode.OutputChannel,
    statusBarItem: vscode.StatusBarItem,
    responseViewer: ResponseViewer
  ) {
    this.client = client;
    this.outputChannel = outputChannel;
    this.statusBarItem = statusBarItem;
    this.responseViewer = responseViewer;
  }

  private updateStatusBar(): void {
    if (!this.client.isConnected()) {
      // No URL configured
      this.statusBarItem.text = `$(settings-gear) MCP: URL Not Set`;
      this.statusBarItem.tooltip = 'Click to set MCP server URL';
      this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    } else if (!this.client.isInitialized()) {
      // URL configured but not initialized
      this.statusBarItem.text = `$(debug-disconnect) MCP: Uninitialized`;
      this.statusBarItem.tooltip = `Server: ${this.client.getserverURL()}\nStatus: Not initialized\nRun "MCP: Send Initialize Request" to initialize`;
      this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    } else {
      // Initialized and ready
      this.statusBarItem.text = `$(check) MCP: Initialized`;
      this.statusBarItem.tooltip = `Server: ${this.client.getserverURL()}\nStatus: Ready\nClick to change server URL`;
      this.statusBarItem.backgroundColor = undefined;
    }
  }

  private showResponse(title: string, response: any, request?: any): void {
    this.responseViewer.show(title, request, response, false);
    // Also keep output channel for reference
    this.outputChannel.clear();
    this.outputChannel.appendLine(`=== ${title} ===`);
    this.outputChannel.appendLine('');
    this.outputChannel.appendLine(JSON.stringify(response, null, 2));
  }

  private showError(title: string, error: Error, request?: any): void {
    this.responseViewer.show(`${title} - ERROR`, request, error.message, true);
    this.outputChannel.appendLine(`=== ${title} - ERROR ===`);
    this.outputChannel.appendLine('');
    this.outputChannel.appendLine(error.message);
    this.outputChannel.show();
    vscode.window.showErrorMessage(`MCP Error: ${error.message}`);
  }

  public initializeFromSettings(): void {
    const config = vscode.workspace.getConfiguration('mcp');
    const serverURL = config.get<string>('serverURL');
    const customHeaders = config.get<Record<string, string>>('customHeaders') || {};

    if (serverURL && serverURL.trim() !== '') {
      this.client.connect(serverURL);
      this.outputChannel.appendLine(`Loaded server URL from settings: ${serverURL}`);
    }

    // Always set custom headers, even if empty (to clear previous headers)
    this.client.setCustomHeaders(customHeaders);
    if (Object.keys(customHeaders).length > 0) {
      this.outputChannel.appendLine(`Loaded custom headers from settings: ${JSON.stringify(customHeaders)}`);
    } else {
      this.outputChannel.appendLine(`Custom headers cleared from settings`);
    }

    // Always update status bar
    this.updateStatusBar();
  }

  async setserverURL(): Promise<void> {
    const config = vscode.workspace.getConfiguration('mcp');
    const currentUrl = config.get<string>('serverURL') || '';

    const url = await vscode.window.showInputBox({
      prompt: 'Enter MCP server URL',
      placeHolder: 'http://localhost:3000/mcp',
      value: currentUrl,
      validateInput: (value) => {
        if (!value) {
          return 'URL is required';
        }
        try {
          new URL(value);
          return null;
        } catch {
          return 'Invalid URL format';
        }
      }
    });

    if (url) {
      // Save to settings
      await config.update('serverURL', url, vscode.ConfigurationTarget.Global);

      // Connect to the new URL
      this.client.connect(url);
      this.updateStatusBar();
      vscode.window.showInformationMessage(`MCP server URL set: ${url}`);
      this.outputChannel.appendLine(`Server URL saved to settings: ${url}`);
    }
  }

  async setCustomHeaders(): Promise<void> {
    const config = vscode.workspace.getConfiguration('mcp');
    const currentHeaders = config.get<Record<string, string>>('customHeaders') || {};

    const headersJson = await vscode.window.showInputBox({
      prompt: 'Enter custom HTTP headers as JSON object',
      placeHolder: '{"Authorization": "Bearer token", "X-Custom-Header": "value"}',
      value: Object.keys(currentHeaders).length > 0 ? JSON.stringify(currentHeaders) : '',
      validateInput: (value) => {
        if (!value || value.trim() === '') {
          return null; // Empty is allowed (clears headers)
        }
        try {
          const parsed = JSON.parse(value);
          if (typeof parsed !== 'object' || Array.isArray(parsed)) {
            return 'Must be a JSON object';
          }
          // Validate all values are strings
          for (const key in parsed) {
            if (typeof parsed[key] !== 'string') {
              return 'All header values must be strings';
            }
          }
          return null;
        } catch {
          return 'Invalid JSON format';
        }
      }
    });

    if (headersJson !== undefined) {
      const headers = headersJson.trim() === '' ? {} : JSON.parse(headersJson);

      // Save to settings
      await config.update('customHeaders', headers, vscode.ConfigurationTarget.Global);

      // Update client
      this.client.setCustomHeaders(headers);

      if (Object.keys(headers).length > 0) {
        vscode.window.showInformationMessage(`Custom headers set: ${JSON.stringify(headers)}`);
        this.outputChannel.appendLine(`Custom headers saved to settings: ${JSON.stringify(headers)}`);
      } else {
        vscode.window.showInformationMessage('Custom headers cleared');
        this.outputChannel.appendLine('Custom headers cleared from settings');
      }
    }
  }

  async uninitialize(): Promise<void> {
    this.client.uninitialize();
    this.updateStatusBar();
    this.outputChannel.clear();
    vscode.window.showInformationMessage('MCP session uninitialized');
  }

  async sendCustomRequest(): Promise<void> {
    const jsonString = await vscode.window.showInputBox({
      prompt: 'Enter JSON-RPC request (method and params fields)',
      placeHolder: '{"method": "tools/list", "params": {}}',
      validateInput: (value) => {
        if (!value) {
          return 'JSON is required';
        }
        try {
          JSON.parse(value);
          return null;
        } catch {
          return 'Invalid JSON format';
        }
      }
    });

    if (jsonString) {
      try {
        const request = JSON.parse(jsonString);
        const response = await this.client.sendCustomRequest(jsonString);
        this.showResponse('Custom Request', response, request);
      } catch (error) {
        this.showError('Custom Request', error as Error, jsonString ? JSON.parse(jsonString) : undefined);
      }
    }
  }

  async initialize(): Promise<void> {
    try {
      const params: InitializeRequest = {
        protocolVersion: '2025-06-18',
        capabilities: {
          roots: {},
          sampling: {},
          elicitation: {},
        },
        clientInfo: {
          name: 'mcp-wireview',
          version: '0.0.1',
        },
      };

      this.responseViewer.clear();
      let sentRequest: any;
      let eventCount = 0;

      const response = await this.client.sendRequest(
        'initialize',
        params,
        (event) => {
          eventCount++;
          this.responseViewer.addEvent(event);
        },
        undefined,
        (request) => {
          sentRequest = request;
        }
      );

      if (eventCount === 0) {
        this.showResponse('Initialize Response', response, sentRequest);
      } else {
        this.responseViewer.showWithEvents('Initialize Response', sentRequest, response, eventCount, false);
      }

      // Update status bar after successful initialization
      this.updateStatusBar();
    } catch (error) {
      this.showError('Initialize', error as Error);
    }
  }

  async listTools(): Promise<void> {
    try {
      this.responseViewer.clear();
      let sentRequest: any;
      let eventCount = 0;

      const response = await this.client.sendRequest(
        'tools/list',
        undefined,
        (event) => {
          eventCount++;
          this.responseViewer.addEvent(event);
        },
        undefined,
        (request) => {
          sentRequest = request;
        }
      );

      if (eventCount === 0) {
        this.showResponse('Tools List Response', response, sentRequest);
      } else {
        this.responseViewer.showWithEvents('Tools List Response', sentRequest, response, eventCount, false);
      }
    } catch (error) {
      this.showError('List Tools', error as Error);
    }
  }

  async listPrompts(): Promise<void> {
    try {
      this.responseViewer.clear();
      let sentRequest: any;
      let eventCount = 0;

      const response = await this.client.sendRequest(
        'prompts/list',
        undefined,
        (event) => {
          eventCount++;
          this.responseViewer.addEvent(event);
        },
        undefined,
        (request) => {
          sentRequest = request;
        }
      );

      if (eventCount === 0) {
        this.showResponse('Prompts List Response', response, sentRequest);
      } else {
        this.responseViewer.showWithEvents('Prompts List Response', sentRequest, response, eventCount, false);
      }
    } catch (error) {
      this.showError('List Prompts', error as Error);
    }
  }

  async listResources(): Promise<void> {
    try {
      this.responseViewer.clear();
      let sentRequest: any;
      let eventCount = 0;

      const response = await this.client.sendRequest(
        'resources/list',
        undefined,
        (event) => {
          eventCount++;
          this.responseViewer.addEvent(event);
        },
        undefined,
        (request) => {
          sentRequest = request;
        }
      );

      if (eventCount === 0) {
        this.showResponse('Resources List Response', response, sentRequest);
      } else {
        this.responseViewer.showWithEvents('Resources List Response', sentRequest, response, eventCount, false);
      }
    } catch (error) {
      this.showError('List Resources', error as Error);
    }
  }

  async callTool(): Promise<void> {
    const toolName = await vscode.window.showInputBox({
      prompt: 'Enter tool name',
      placeHolder: 'my-tool'
    });

    if (!toolName) {
      return;
    }

    const argsString = await vscode.window.showInputBox({
      prompt: 'Enter tool arguments as JSON (optional)',
      placeHolder: '{"arg1": "value1", "arg2": "value2"}',
      validateInput: (value) => {
        if (!value) {
          return null;
        }
        try {
          JSON.parse(value);
          return null;
        } catch {
          return 'Invalid JSON format';
        }
      }
    });

    try {
      const args = argsString ? JSON.parse(argsString) : {};
      const params = {
        name: toolName,
        arguments: args
      };

      this.responseViewer.clear();
      let sentRequest: any;
      let eventCount = 0;

      const response = await this.client.sendRequest(
        'tools/call',
        params,
        (event) => {
          eventCount++;
          this.responseViewer.addEvent(event);
        },
        undefined,
        (request) => {
          sentRequest = request;
        }
      );

      if (eventCount === 0) {
        this.showResponse(`Call Tool: ${toolName}`, response, sentRequest);
      } else {
        this.responseViewer.showWithEvents(`Call Tool: ${toolName}`, sentRequest, response, eventCount, false);
      }
    } catch (error) {
      this.showError('Call Tool', error as Error);
    }
  }
}
