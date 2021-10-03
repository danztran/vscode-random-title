// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { App } from "./app";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const app = new App(context);

  const randomizing = wrapCommand(context, app.randomTitle);
  randomizing();

  const disposable = vscode.commands.registerCommand(
    "vscode-random-title.randomTitle",
    randomizing,
  );

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}

export function wrapCommand(
  ctx: vscode.ExtensionContext,
  fn: (...args: any[]) => Promise<any>,
) {
  return async (...args: any[]): Promise<any> => {
    try {
      return await fn(ctx, ...args);
    } catch (err) {
      console.error(err);
    }
  };
}
