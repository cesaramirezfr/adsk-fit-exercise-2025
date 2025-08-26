import type { Book } from "../models/book.model";

export type MatchMode = "any" | "all";

export interface BooksExternalClient {
  search(params: {
    keywords: string[];
    page?: number;
    limit?: number;
    match?: MatchMode;
  }): Promise<Book[]>;
}

let _client: BooksExternalClient | null = null;

export const setBooksClient = (c: BooksExternalClient) => {
  _client = c;
};

export const getBooksClient = () => {
  if (!_client) {
    throw new Error("Books client not configured");
  }
  return _client;
};
