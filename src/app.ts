import * as vscode from "vscode";
import { ExtensionContext } from "vscode";
import { getQuotes, Quote, RequestQuotes } from "./quotable";
import * as storage from "./storage/storage";
import { DefaultLogger, Logger } from "./utils";

export class App extends DefaultLogger {
  private ctx: ExtensionContext;

  constructor(context: ExtensionContext) {
    super({
      context,
      level: "debug",
    });
    this.ctx = context;
    this.getRandomQuote = this.getRandomQuote.bind(this);
    this.randomTitle = this.randomTitle.bind(this);
    this.fetchNewQuotes = this.fetchNewQuotes.bind(this);
  }

  getRandomQuote(): Quote {
    const quotes = storage.getLocalQuotes(this.ctx);
    const quote = quotes[Math.floor(Math.random() * quotes.length)];
    return quote;
  }

  async randomTitle() {
    this.fetchNewQuotes();
    const quote = this.getRandomQuote();
    const title = makeTitle(quote);
    this.info("new title:", title);
    await updateTile(title);
  }

  async fetchNewQuotes() {
    const updatingAt = storage.getUpdatingAt(this.ctx);
    const ts = Date.now();
    const since = ts - updatingAt;
    if (since < 10000) {
      this.info(`skip fetching because it had updated ${since / 1000}s ago`);
      return;
    }
    this.info(`fetching...`);
    storage.setUpdatingAt(this.ctx, ts);

    const lastRes = storage.getLastResponseGetQuotes(this.ctx);
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
      storage.saveLastResponseGetQuotes(this.ctx, resp);
      if (resp.results.length > 0) {
        const quotes = mergeLocalQuotes(this.ctx, resp.results);
        storage.saveLocalQuotes(this.ctx, quotes);
        this.debug(`saved ${quotes.length} quotes`);
      }
    } catch (err) {
      this.error(err);
    }
  }
}

const updateTile = async (title: string): Promise<void> => {
  const config = vscode.workspace.getConfiguration();
  await config.update("window.title", title, vscode.ConfigurationTarget.Global);
};

const makeTitle = (quote: Quote) => {
  const title = `“${quote.content}” - ${quote.author}`;
  return title;
};

const mergeLocalQuotes = (
  ctx: ExtensionContext,
  newQuotes: Quote[],
): Quote[] => {
  const localQuotes = storage.getLocalQuotes(ctx);
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
};
