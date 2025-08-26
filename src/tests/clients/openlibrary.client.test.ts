import { OpenLibraryClient } from "../../clients/openlibrary.client";

describe("OpenLibraryClient.search", () => {
  beforeEach(() => {
    (globalThis as any).fetch = jest.fn();
  });
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("builds OR query for match=any and maps results", async () => {
    (fetch as unknown as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        docs: [
          {
            key: "/works/OL1W",
            title: "The Hobbit",
            author_name: ["J.R.R. Tolkien"],
          },
        ],
      }),
    });

    const client = new OpenLibraryClient();

    const items = await client.search({
      keywords: ["hobbit", "tolkien"],
      page: 1,
      limit: 5,
      match: "any",
    });

    const calledUrl = new URL((fetch as any).mock.calls[0][0] as string);
    const expectedQuery =
      "(title:hobbit OR author:hobbit) OR (title:tolkien OR author:tolkien)";

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(calledUrl.pathname).toBe("/search.json");
    expect(calledUrl.searchParams.get("page")).toBe("1");
    expect(calledUrl.searchParams.get("limit")).toBe("5");
    expect(decodeURIComponent(calledUrl.searchParams.get("q")!)).toBe(
      expectedQuery,
    );
    expect(items).toEqual([
      {
        id: "/works/OL1W",
        title: "The Hobbit",
        authors: ["J.R.R. Tolkien"],
      },
    ]);
  });

  it("builds AND query for match=all", async () => {
    (fetch as unknown as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ docs: [] }),
    });

    const client = new OpenLibraryClient();

    await client.search({
      keywords: ["harry", "potter"],
      match: "all",
    });

    const calledUrl = new URL((fetch as any).mock.calls[0][0] as string);
    const expectedQuery =
      "(title:harry OR author:harry) AND (title:potter OR author:potter)";

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(decodeURIComponent(calledUrl.searchParams.get("q")!)).toBe(
      expectedQuery,
    );
  });

  it("throws on non-ok response", async () => {
    (fetch as unknown as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 429,
    });

    const client = new OpenLibraryClient();

    await expect(client.search({ keywords: ["anything"] })).rejects.toThrow(
      "OpenLibrary error: 429",
    );
  });
});
