import * as vscode from "vscode";
import { ExtensionContext } from "vscode";
import { getQuotes, Quote, RequestQuotes } from "./quotable";
import { DefaultLogger, LogLevel } from "./logger";
import { Storage } from "./storage/storage";

export class App extends DefaultLogger {
  private storage: Storage;

  constructor(ctx: ExtensionContext) {
    const channel = vscode.window.createOutputChannel("Random Title");
    super({ channel, name: "app" });
    const logLevel = this.getConfigLogLevel() as LogLevel;
    this.setLevel(logLevel);
    this.storage = new Storage({ ctx, channel, logLevel });
    this.randomTitle = this.randomTitle.bind(this);
    this.previousTitle = this.previousTitle.bind(this);
  }

  getRandomQuote(): Quote {
    const quotes = this.storage.getLocalQuotes();
    const quote = quotes[Math.floor(Math.random() * quotes.length)];
    return quote;
  }

  async activate() {
    if (!this.isRandomOnWorkspaceReload() && this.isTitleChanged()) {
      this.info("skip randomizing because it had changed the title");
      return;
    }
    this.randomTitle();
  }

  isRandomOnWorkspaceReload(): boolean {
    const { workspace } = vscode;
    const config = workspace.getConfiguration("title");
    return config.get("randomOnWorkspaceReload") || false;
  }

  async randomTitle() {
    this.fetchNewQuotes();
    const quote = this.getRandomQuote();
    const title = this.makeTitle(quote);
    this.info("new title:", title);
    await this.updateTitle(title);
  }

  async previousTitle() {
    const title = this.storage.getPreviousWorkspaceTitle();
    if (title === "") {
      vscode.window.showInformationMessage("No more previous title");
      return;
    }
    this.info("previous title:", title);
    await this.updateTitle(title);
  }

  async fetchNewQuotes() {
    const updatingAt = this.storage.getUpdatingAt();

    const ts = Date.now();
    const since = ts - updatingAt;
    if (since < 10000) {
      this.info(`last updating at: ${Math.round(since / 1000)}s ago`);
      return;
    }
    this.info("last updating at:", new Date(updatingAt).toLocaleString());

    this.debug(`fetching new votes...`);
    this.storage.setUpdatingAt(ts);

    const lastRes = this.storage.getLastResponseGetQuotes();
    const limit = 10;
    let page = lastRes?.page || 0;
    if (lastRes?.results.length === limit) {
      page = page + 1;
    }
    const opt: RequestQuotes = {
      page: page || 1,
      order: "asc",
      limit,
    };
    this.info("fetch quote options:", opt);

    try {
      const resp = await getQuotes(opt);
      this.debug("fetch new quotes size:", resp.results.length);
      this.storage.saveLastResponseGetQuotes(resp);
      if (resp.results.length > 0) {
        const quotes = this.mergeLocalQuotes(resp.results);
        this.storage.saveLocalQuotes(quotes);
        this.info(`saved ${quotes.length} quotes`);
      }
    } catch (err) {
      this.error(err);
    }
  }

  mergeLocalQuotes(newQuotes: Quote[]): Quote[] {
    const localQuotes = this.storage.getLocalQuotes();
    const dict: Record<string, Quote> = {};
    for (const quote of localQuotes) {
      dict[quote._id] = quote;
    }
    for (const quote of newQuotes) {
      dict[quote._id] = quote;
    }
    const quotes = [];
    for (const quote of Object.values(dict)) {
      quotes.push(quote);
    }

    return quotes;
  }

  async updateTitle(title: string): Promise<void> {
    const config = vscode.workspace.getConfiguration("window");
    await config.update("title", title, false);
    await this.storage.saveWorkspaceTitle(title);
  }

  isTitleChanged(): boolean {
    const workspaceConfig = vscode.workspace.getConfiguration("window");
    const configTitle = workspaceConfig.get("title");
    const savedTitle = this.storage.getWorkspaceTitle();
    return configTitle === savedTitle;
  }

  getConfigLogLevel(): string {
    const config = vscode.workspace.getConfiguration("title");
    const level = config.get("logLevel", "info");
    return level;
  }

  makeTitle(quote: Quote) {
    const title = `“${quote.content}” - ${quote.author}`;
    return title;
  }
}
