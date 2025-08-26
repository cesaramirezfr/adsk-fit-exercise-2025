import type { Book } from "../models/book.model";
import type { BooksExternalClient, MatchMode } from "./books.client";
import { OPENLIBRARY_SEARCH_API } from "../constants";

export class OpenLibraryClient implements BooksExternalClient {
  constructor(private baseUrl = OPENLIBRARY_SEARCH_API) {}

  async search(opts: {
    keywords: string[];
    page?: number;
    limit?: number;
    match?: MatchMode;
  }): Promise<Book[]> {
    const { keywords, page = 1, limit = 10, match = "any" } = opts;

    const group = (kw: string) => `(title:${kw} OR author:${kw})`;
    const joiner = match === "all" ? " AND " : " OR ";
    const queryExpr = keywords.map(group).join(joiner) || "";

    const params = new URLSearchParams({
      q: queryExpr || "",
      page: String(page),
      limit: String(limit),
    });

    const url = `${this.baseUrl}?${params.toString()}`;

    const res = await fetch(encodeURI(url));

    if (!res.ok) {
      throw new Error(`OpenLibrary error: ${res.status}`);
    }

    const data: any = await res.json();

    const docs: any[] = Array.isArray(data.docs) ? data.docs : [];

    return docs.map((d) => ({
      id: String(d.key ?? ""),
      title: String(d.title ?? ""),
      authors: Array.isArray(d.author_name) ? d.author_name.map(String) : [],
    })) as Book[];
  }
}
