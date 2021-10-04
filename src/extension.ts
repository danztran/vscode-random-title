// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { App } from "./app";

type Handler = (...args: any[]) => Promise<any>;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const app = new App(context);
  app.randomTitle();

  const disposable = vscode.commands.registerCommand(
    "vscode-random-title.randomTitle",
    app.randomTitle,
  );

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
