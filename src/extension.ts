import * as vscode from 'vscode';
import { MCPClient } from './mcpClient';
import { MCPCommands } from './commands';
import { ResponseViewer } from './responseViewer';

export function activate(context: vscode.ExtensionContext) {
  console.log('MCP WireView extension is now active');

  const outputChannel = vscode.window.createOutputChannel('MCP WireView');

  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBarItem.command = 'mcp.setserverURL';
  statusBarItem.show();

  const client = new MCPClient();
  const responseViewer = new ResponseViewer(context);
  const commands = new MCPCommands(client, outputChannel, statusBarItem, responseViewer);

  const disposables = [
    vscode.commands.registerCommand('mcp.setserverURL', () => commands.setserverURL()),
    vscode.commands.registerCommand('mcp.setCustomHeaders', () => commands.setCustomHeaders()),
    vscode.commands.registerCommand('mcp.uninitialize', () => commands.uninitialize()),
    vscode.commands.registerCommand('mcp.sendRequest', () => commands.sendCustomRequest()),
    vscode.commands.registerCommand('mcp.initialize', () => commands.initialize()),
    vscode.commands.registerCommand('mcp.listTools', () => commands.listTools()),
    vscode.commands.registerCommand('mcp.listPrompts', () => commands.listPrompts()),
    vscode.commands.registerCommand('mcp.listResources', () => commands.listResources()),
    vscode.commands.registerCommand('mcp.callTool', () => commands.callTool()),
    outputChannel,
    statusBarItem
  ];

  context.subscriptions.push(...disposables);

  // Initialize from settings
  commands.initializeFromSettings();

  // Watch for configuration changes
  const configChangeListener = vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration('mcp.serverURL') || e.affectsConfiguration('mcp.customHeaders')) {
      commands.initializeFromSettings();
      outputChannel.appendLine('Configuration changed - settings reloaded');
    }
  });
  context.subscriptions.push(configChangeListener);
}

export function deactivate() {
  console.log('MCP WireView extension is now deactivated');
}
