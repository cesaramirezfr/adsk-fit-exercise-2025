import { RedisCachedBooksClient } from "../../clients/cached-books.client";
import type { BooksExternalClient } from "../../clients/books.client";
import { BookSearchResult } from "../../models/book.model";

describe("RedisCachedBooksClient", () => {
  const sampleResponse: BookSearchResult = {
    count: 1,
    items: [
      {
        id: "/works/OL1",
        title: "T",
        authors: ["A"],
      },
    ],
  };

  it("returns cached results on hit (does not call inner)", async () => {
    const redis = {
      get: jest.fn().mockResolvedValue(JSON.stringify(sampleResponse)),
      set: jest.fn(),
    } as any;

    const inner: BooksExternalClient = {
      search: jest.fn(), // should not be called
    };

    const client = new RedisCachedBooksClient(redis, inner, { ttlSeconds: 60 });

    const res = await client.search({
      keywords: ["foo"],
      page: 1,
      limit: 5,
      match: "any",
    });

    expect(res).toEqual(sampleResponse);
    expect(inner.search).not.toHaveBeenCalled();
    expect(redis.get).toHaveBeenCalledTimes(1);
    expect(redis.set).not.toHaveBeenCalled();
  });

  it("miss → calls inner and sets cache with TTL", async () => {
    const redis = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue("OK"),
    } as any;

    const inner: BooksExternalClient = {
      search: jest.fn().mockResolvedValue(sampleResponse),
    };

    const client = new RedisCachedBooksClient(redis, inner, { ttlSeconds: 42 });

    const params = {
      keywords: ["foo", "bar"],
      page: 2,
      limit: 7,
      match: "all" as const,
    };

    const res = await client.search(params);

    expect(res).toEqual(sampleResponse);
    expect(inner.search).toHaveBeenCalledWith(params);
    expect(redis.get).toHaveBeenCalledTimes(1);
    expect(redis.set).toHaveBeenCalledTimes(1);

    const [keyArg, valueArg, optsArg] = (redis.set as jest.Mock).mock.calls[0];

    expect(keyArg).toMatch(/^books:/);
    expect(typeof valueArg).toBe("string");
    expect(optsArg).toEqual({ expiration: { type: "EX", value: 42 } });
  });

  it("keyword order-insensitive key", async () => {
    const redis = {
      get: jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(null),
      set: jest.fn().mockResolvedValue("OK"),
    } as any;

    const inner: BooksExternalClient = {
      search: jest.fn().mockResolvedValue(sampleResponse),
    };

    const client = new RedisCachedBooksClient(redis, inner, { ttlSeconds: 60 });

    await client.search({
      keywords: ["B", "a"],
      page: 1,
      limit: 10,
      match: "any",
    });

    await client.search({
      keywords: ["a", "B"],
      page: 1,
      limit: 10,
      match: "any",
    });

    const keys = (redis.set as jest.Mock).mock.calls.map((c) => c[0]);

    expect(keys.length).toBe(2);
    expect(keys[0]).toBe(keys[1]);
  });

  it("continues on cache get/set errors", async () => {
    const redis = {
      get: jest.fn().mockRejectedValue(new Error("redis-get-fail")),
      set: jest.fn().mockRejectedValue(new Error("redis-set-fail")),
    } as any;

    const inner: BooksExternalClient = {
      search: jest.fn().mockResolvedValue(sampleResponse),
    };

    const client = new RedisCachedBooksClient(redis, inner, { ttlSeconds: 60 });

    const res = await client.search({ keywords: ["x"] });

    expect(res).toEqual(sampleResponse);
    expect(inner.search).toHaveBeenCalledTimes(1);
  });
});
