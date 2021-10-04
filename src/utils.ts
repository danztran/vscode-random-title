import * as vscode from "vscode";
import { OutputChannel, ExtensionContext } from "vscode";

const DEBUG = 1;
const INFO = 2;
const WARN = 3;
const ERROR = 4;

export type VoidFunc = (...args: unknown[]) => void;

export interface Logger {
  info: VoidFunc;
  debug: VoidFunc;
}

export interface LoggerProps {
  name?: string;
  context: ExtensionContext;
  channel?: OutputChannel;
  level?: "info" | "debug";
}

export class DefaultLogger implements Logger {
  private name: string;
  private context: ExtensionContext;
  private channel: OutputChannel;
  private level: number;

  constructor({
    name = "[logger]",
    channel = vscode.window.createOutputChannel("Random Title"),
    context,
    level = "debug",
  }: LoggerProps) {
    this.name = name;
    this.debug = this.debug.bind(this);
    this.info = this.info.bind(this);
    this.warn = this.warn.bind(this);
    this.error = this.error.bind(this);
    this.context = context;
    this.channel = channel;
    this.level = this.parseLevel(level);
    this.debug("init logger");
  }

  debug(...args: unknown[]): void {
    this.log(DEBUG, ...args);
  }

  info(...args: unknown[]): void {
    this.log(INFO, ...args);
  }

  warn(...args: unknown[]): void {
    this.log(WARN, ...args);
  }

  error(...args: unknown[]): void {
    this.log(ERROR, ...args);
  }

  log(level: number, ...args: unknown[]): void {
    args = args.map(e => {
      if (typeof e === "object") {
        return JSON.stringify(e);
      }
      return e;
    });
    if (level >= this.level) {
      this.channel.appendLine(`${this.name} ${args.join(" ")}`);
    }
  }

  parseLevel(level = "debug"): number {
    switch (level.toLowerCase()) {
      case "error":
        return 4;
      case "warn":
        return 3;
      case "info":
        return 2;
      case "debug":
        return 1;
      default:
        return 0;
    }
  }
}
