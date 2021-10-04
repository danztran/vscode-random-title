// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { App } from "./app";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  const app = new App(context);
  app.activate();

  const randomTitle = vscode.commands.registerCommand(
    "vscode-random-title.randomTitle",
    app.randomTitle,
  );

  const previousTitle = vscode.commands.registerCommand(
    "vscode-random-title.previousTitle",
    app.previousTitle,
  );

  context.subscriptions.push(randomTitle, previousTitle);
}

// this method is called when your extension is deactivated
export function deactivate() {}
