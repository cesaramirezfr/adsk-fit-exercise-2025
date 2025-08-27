import type { BookSearchResult } from "../models/book.model";
import type { BooksExternalClient, MatchMode } from "./books.client";
import type { RedisClientType } from "redis";
import { CACHE_TTL } from "../constants";

export class RedisCachedBooksClient implements BooksExternalClient {
  private ttlSeconds: number;

  constructor(
    private redis: RedisClientType,
    private inner: BooksExternalClient,
    opts?: { ttlSeconds?: number },
  ) {
    this.ttlSeconds = opts?.ttlSeconds ?? CACHE_TTL;
  }

  async search(opts: {
    keywords: string[];
    page?: number;
    limit?: number;
    match?: MatchMode;
  }): Promise<BookSearchResult> {
    const key = "books:" + this.makeKey(opts);

    // Try cache first
    try {
      const hit = await this.redis.get(key);
      if (hit) {
        return JSON.parse(hit) as BookSearchResult;
      }
    } catch {
      // Cache errors shouldn't break the API. Fall through to origin.
    }

    // Fetch origin
    const fresh = await this.inner.search(opts);

    // Store in cache
    try {
      await this.redis.set(key, JSON.stringify(fresh), {
        expiration: {
          type: "EX",
          value: this.ttlSeconds,
        },
      });
    } catch {
      // Ignore cache set failures
    }

    return fresh;
  }

  private makeKey(o: {
    keywords: string[];
    page?: number;
    limit?: number;
    match?: MatchMode;
  }) {
    const kw = [...(o.keywords ?? [])]
      .map((s) => s.toLowerCase().trim())
      .filter(Boolean)
      .sort();
    const page = o.page ?? 1;
    const limit = o.limit ?? 10;
    const match = o.match ?? "any";
    return JSON.stringify({ kw, page, limit, match });
  }
}
