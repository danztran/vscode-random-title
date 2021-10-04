import * as vscode from "vscode";
import { ExtensionContext } from "vscode";
import { getQuotes, Quote, RequestQuotes } from "./quotable";
import { DefaultLogger } from "./logger";
import { Storage } from "./storage/storage";

export class App extends DefaultLogger {
  private storage: Storage;

  constructor(ctx: ExtensionContext) {
    const channel = vscode.window.createOutputChannel("Random Title");
    super({
      level: "debug",
      channel,
    });
    this.storage = new Storage({ ctx, channel });
    this.randomTitle = this.randomTitle.bind(this);
    this.previousTitle = this.previousTitle.bind(this);
  }

  getRandomQuote(): Quote {
    const quotes = this.storage.getLocalQuotes();
    const quote = quotes[Math.floor(Math.random() * quotes.length)];
    return quote;
  }

  async activate() {
    this.fetchNewQuotes();
    if (this.isTitleChanged()) {
      this.info("skip randomizing because it had changed the title");
      return;
    }
    this.randomTitle();
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
    this.debug("previous title:", title);
    await this.updateTitle(title);
  }

  async fetchNewQuotes() {
    const updatingAt = this.storage.getUpdatingAt();
    const ts = Date.now();
    const since = ts - updatingAt;
    if (since < 10000) {
      this.info(`skip fetching because it had updated ${since / 1000}s ago`);
      return;
    }
    this.info(`fetching...`);
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
    this.debug("get quote options:", opt);

    try {
      const resp = await getQuotes(opt);
      this.debug("get quotes response:", resp);
      this.storage.saveLastResponseGetQuotes(resp);
      if (resp.results.length > 0) {
        const quotes = this.mergeLocalQuotes(resp.results);
        this.storage.saveLocalQuotes(quotes);
        this.debug(`saved ${quotes.length} quotes`);
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

  makeTitle(quote: Quote) {
    const title = `“${quote.content}” - ${quote.author}`;
    return title;
  }
}
