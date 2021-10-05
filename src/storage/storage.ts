import { ExtensionContext, Memento } from "vscode";
import { DefaultLogger, LoggerProps } from "../logger";
import { Quote, ResponseGetQuotes } from "../quotable";
import { seedQuotes } from "./seed";

const QUOTES = "quotes";
const RESPONSE_GET_QUOTES = "responseGetQuotes";
const UPDATING_QUOTES = "updating_at";
const WORKSPACE_TITLES = "workspace_titles";
const WORKSPACE_TITLES_INDEX = "workspace_titles_index";

interface LastResponseGetQuotes extends ResponseGetQuotes {
  updatedAt?: number;
}

export interface StorageProps extends LoggerProps {
  ctx: ExtensionContext;
}

export class Storage extends DefaultLogger {
  private global: Memento;
  private workspace: Memento;

  constructor(props: StorageProps) {
    super({
      ...props,
      name: "storage",
    });
    this.global = props.ctx.globalState;
    this.workspace = props.ctx.workspaceState;
  }

  async saveLastResponseGetQuotes(res: LastResponseGetQuotes): Promise<void> {
    await this.global.update(RESPONSE_GET_QUOTES, res);
  }

  getLastResponseGetQuotes(): LastResponseGetQuotes | undefined {
    return this.global.get(RESPONSE_GET_QUOTES);
  }

  async saveLocalQuotes(quotes: Quote[]): Promise<void> {
    await this.global.update(QUOTES, quotes);
  }

  getLocalQuotes(): Quote[] {
    return this.global.get(QUOTES) || seedQuotes;
  }

  async setUpdatingAt(ts: number) {
    await this.global.update(UPDATING_QUOTES, ts);
  }

  getUpdatingAt(): number {
    return this.global.get(UPDATING_QUOTES) || 0;
  }

  async saveWorkspaceTitle(title: string): Promise<void> {
    const titles = this.listWorkspaceTitles();
    for (const [i, t] of titles.entries()) {
      if (t === title) {
        await this.setWorkspaceTitleIndex(i);
        return;
      }
    }
    await this.setWorkspaceTitleIndex(titles.length);
    titles.push(title);
    await this.workspace.update(WORKSPACE_TITLES, titles);
  }

  listWorkspaceTitles(): string[] {
    return this.workspace.get(WORKSPACE_TITLES) || [];
  }

  getWorkspaceTitleIndex(): number {
    return this.workspace.get(WORKSPACE_TITLES_INDEX) || 0;
  }

  async setWorkspaceTitleIndex(index: number) {
    await this.workspace.update(WORKSPACE_TITLES_INDEX, index);
  }

  getPreviousWorkspaceTitle(): string {
    const titles = this.listWorkspaceTitles();
    const index = this.getWorkspaceTitleIndex();
    return titles[index - 1] || "";
  }

  getWorkspaceTitle(): string {
    const titles = this.listWorkspaceTitles();
    const index = this.getWorkspaceTitleIndex();
    return titles[index] || "";
  }
}
