import { OutputChannel } from "vscode";

const DEBUG = 1;
const INFO = 2;
const WARN = 3;
const ERROR = 4;

export type VoidFunc = (...args: unknown[]) => void;

export type LogLevel = "info" | "debug" | "warn" | "error";

export interface Logger {
  info: VoidFunc;
  debug: VoidFunc;
}

export interface LoggerProps {
  name?: string;
  channel: OutputChannel;
  logLevel?: LogLevel;
}

export class DefaultLogger implements Logger {
  private name: string;
  private channel: OutputChannel;
  private level: number = 1;
  private logLevel: LogLevel = "debug";

  constructor({ name = "default", logLevel = "debug", channel }: LoggerProps) {
    this.name = name;
    this.debug = this.debug.bind(this);
    this.info = this.info.bind(this);
    this.warn = this.warn.bind(this);
    this.error = this.error.bind(this);
    this.channel = channel;
    this.setLevel(logLevel);
  }

  setLevel(level: LogLevel): void {
    this.logLevel = level;
    this.level = this.parseLevel(level);
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

  private log(level: number, ...args: unknown[]): void {
    args = args.map(e => {
      if (typeof e === "object") {
        return JSON.stringify(e);
      }
      return e;
    });
    if (level >= this.level) {
      const time = this.getCurrentTime();
      this.channel.appendLine(
        `${time}\t${this.logLevel}\t${this.name}\t\t${args.join(" ")}`,
      );
    }
  }

  private getCurrentTime(): string {
    const d = new Date();
    const format = (n: number) => n.toString().padStart(2, "0");
    const hr = format(d.getHours());
    const min = format(d.getMinutes());
    const sec = format(d.getSeconds());
    const msec = d.getMilliseconds().toString().padEnd(3, "0");
    const s = `${hr}:${min}:${sec}.${msec}`;
    return s;
  }

  private parseLevel(level = "debug"): number {
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
