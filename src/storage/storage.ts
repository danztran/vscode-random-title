import { resolvePtr } from "dns";
import { ExtensionContext } from "vscode";
import { Quote, ResponseGetQuotes } from "../quotable";
import { seedQuotes } from "./seed";

const QUOTES = "quotes";
const RESPONSE_GET_QUOTES = "responseGetQuotes";
const UPDATING_QUOTES = "updating_at";

interface LastResponseGetQuotes extends ResponseGetQuotes {
  updatedAt?: number;
}

export const saveLastResponseGetQuotes = (
  ctx: ExtensionContext,
  res: LastResponseGetQuotes,
): void => {
  res.updatedAt = Date.now();
  ctx.globalState.update(RESPONSE_GET_QUOTES, res);
};

export const getLastResponseGetQuotes = (
  ctx: ExtensionContext,
): LastResponseGetQuotes | undefined => {
  return ctx.globalState.get(RESPONSE_GET_QUOTES);
};

export const saveLocalQuotes = (
  ctx: ExtensionContext,
  quotes: Quote[],
): void => {
  ctx.globalState.update(QUOTES, quotes);
};

export const getLocalQuotes = (ctx: ExtensionContext): Quote[] => {
  return ctx.globalState.get(QUOTES) || seedQuotes;
};

export const setUpdatingAt = (ctx: ExtensionContext, ts: number) => {
  return ctx.globalState.update(UPDATING_QUOTES, ts);
};

export const getUpdatingAt = (ctx: ExtensionContext): number => {
  return ctx.globalState.get(UPDATING_QUOTES) || 0;
};
