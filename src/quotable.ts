import { IncomingMessage } from "http";
import { request } from "https";
import { stringify } from "querystring";

export interface Quote {
  _id: string;
  tags: string[];
  content: string;
  author: string;
  authorSlug: string;
  length: number;
  dateAdded: Date;
  dateModified: Date;
}

export type ResponseGetQuote = Quote;

export interface ResponseGetQuotes {
  count: number;
  totalCount: number;
  page: number;
  totalPages: number;
  lastItemIndex: number;
  results: Array<ResponseGetQuote>;
}

export interface RequestQuotes {
  maxLength?: number;
  minLength?: number;
  tags?: string;
  author?: string;
  authorId?: string;
  sortBy?: "dateAdded" | "dateModified" | "author" | "content";
  order?: "asc" | "desc";
  limit?: number;
  page?: number;
}

const getJson = async <T>(path: string): Promise<T> => {
  return new Promise((resolve, reject) => {
    const method = "GET";
    const hostname = "api.quotable.io";
    const port = 443;
    const options = {
      hostname,
      port,
      method,
      path,
    };

    const rejectWrap = (err: any) => {
      reject(`request failed: ${JSON.stringify(options)} / ${err}`);
    };

    const req = request(options, async res =>
      onJsonRes<T>(res, resolve, rejectWrap),
    );

    req.on("error", err => {
      reject(err);
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request time out"));
    });

    req.end();
  });
};

const onJsonRes = <T>(
  res: IncomingMessage,
  resolve: (value: T | PromiseLike<T>) => void,
  reject: (reason?: any) => void,
): void => {
  let buf = "";
  res.on("data", chunk => (buf += chunk));
  res.on("end", () => {
    try {
      const data = JSON.parse(buf);
      resolve(data);
    } catch (err) {
      reject(`cannot parse json: ${buf} / ${err}`);
    }
  });
};

export const getRandomQuote = () => getJson<ResponseGetQuote>("/random");

export const getQuotes = (opt: RequestQuotes): Promise<ResponseGetQuotes> => {
  const str = stringify(opt as any);
  const path = `/quotes?${str}`;
  return getJson<ResponseGetQuotes>(path);
};
