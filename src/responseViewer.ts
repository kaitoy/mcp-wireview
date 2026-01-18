import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class ResponseViewer {
  private panel: vscode.WebviewPanel | undefined;
  private eventHistory: Array<{ type: string; data: any; timestamp: number }> = [];

  constructor(private context: vscode.ExtensionContext) {}

  public show(title: string, request?: any, response?: any, isError: boolean = false): void {
    if (!this.panel) {
      this.createPanel();
    }

    this.panel!.title = title;
    this.panel!.webview.html = this.getWebviewContent(title, request, response, undefined, isError);
    this.panel!.reveal(vscode.ViewColumn.Two);
  }

  public addEvent(event: any): void {
    this.eventHistory.push({
      type: 'event',
      data: event,
      timestamp: Date.now(),
    });
  }

  public showWithEvents(
    title: string,
    request: any,
    finalResponse: any,
    eventCount: number,
    isError: boolean = false
  ): void {
    if (!this.panel) {
      this.createPanel();
    }

    const eventsData = this.eventHistory.map((event, index) => ({
      index: index + 1,
      data: event.data
    }));

    this.panel!.title = title;
    this.panel!.webview.html = this.getWebviewContent(
      title,
      request,
      finalResponse,
      { events: eventsData, eventCount },
      isError
    );
    this.panel!.reveal(vscode.ViewColumn.Two);
  }

  public clear(): void {
    this.eventHistory = [];
  }

  private createPanel(): void {
    this.panel = vscode.window.createWebviewPanel(
      'mcpResponse',
      'MCP Response',
      vscode.ViewColumn.Two,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.file(path.join(this.context.extensionPath, 'out', 'webview'))
        ]
      }
    );

    this.panel.onDidDispose(() => {
      this.panel = undefined;
      this.eventHistory = [];
    });
  }

  private getWebviewContent(
    title: string,
    request: any,
    response: any,
    eventsInfo?: { events: Array<{ index: number; data: any }>; eventCount: number },
    isError: boolean = false
  ): string {
    const webviewPath = path.join(this.context.extensionPath, 'out', 'webview');
    const indexPath = path.join(webviewPath, 'index.html');

    // Read the Vite-built index.html
    let html = '';
    try {
      html = fs.readFileSync(indexPath, 'utf8');
    } catch (error) {
      return this.getErrorHtml('Failed to load webview bundle. Please run "npm run compile:webview" first.');
    }

    // Find script and CSS references in the built HTML
    const scriptMatch = html.match(/<script[^>]*src="([^"]+)"[^>]*>/);
    const cssMatch = html.match(/<link[^>]*href="([^"]+)"[^>]*>/);

    if (!scriptMatch) {
      return this.getErrorHtml('Failed to find script bundle in built HTML.');
    }

    const scriptUri = this.panel!.webview.asWebviewUri(
      vscode.Uri.file(path.join(webviewPath, scriptMatch[1]))
    );
    const cssUri = cssMatch
      ? this.panel!.webview.asWebviewUri(
          vscode.Uri.file(path.join(webviewPath, cssMatch[1]))
        )
      : '';

    const cspSource = this.panel!.webview.cspSource;

    const initialData = {
      title,
      request,
      response,
      events: eventsInfo?.events,
      eventCount: eventsInfo?.eventCount,
      isError
    };

    // Encode initial data in a meta tag to avoid CSP inline script violation
    const encodedData = Buffer.from(JSON.stringify(initialData)).toString('base64');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource} 'unsafe-inline'; script-src ${cspSource};">
  <meta id="vscode-initial-data" data-initial-data="${encodedData}">
  <title>${this.escapeHtml(title)}</title>
  ${cssUri ? `<link rel="stylesheet" href="${cssUri}">` : ''}
</head>
<body>
  <div id="root"></div>
  <script type="module" src="${scriptUri}"></script>
</body>
</html>`;
  }

  private getErrorHtml(errorMessage: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 20px;
      color: #f48771;
      background-color: #1e1e1e;
    }
  </style>
</head>
<body>
  <h1>Webview Error</h1>
  <p>${this.escapeHtml(errorMessage)}</p>
</body>
</html>`;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
