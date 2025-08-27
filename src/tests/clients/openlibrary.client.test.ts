import { OpenLibraryClient } from "../../clients/openlibrary.client";
import { Book } from "../../models/book.model";

describe("OpenLibraryClient.search", () => {
  beforeEach(() => {
    (globalThis as any).fetch = jest.fn();
  });
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("builds OR query for match=any and maps results", async () => {
    const bookMock = {
      key: "/works/OL1W",
      title: "The Hobbit",
      author_name: ["J.R.R. Tolkien"],
    };

    (fetch as unknown as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        numFound: 1,
        docs: [bookMock],
      }),
    });

    const client = new OpenLibraryClient();

    const result = await client.search({
      keywords: ["hobbit", "tolkien"],
      page: 1,
      limit: 5,
      match: "any",
    });

    const calledUrl = new URL((fetch as any).mock.calls[0][0] as string);
    const expectedQuery =
      "(title:hobbit OR author:hobbit) OR (title:tolkien OR author:tolkien)";
    const expectedBook: Book = {
      id: "/works/OL1W",
      title: "The Hobbit",
      authors: ["J.R.R. Tolkien"],
    };

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(calledUrl.pathname).toBe("/search.json");
    expect(calledUrl.searchParams.get("page")).toBe("1");
    expect(calledUrl.searchParams.get("limit")).toBe("5");
    expect(calledUrl.searchParams.get("q")).toBe(expectedQuery);
    expect(result.count).toBe(1);
    expect(result.items).toEqual([expectedBook]);
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
    expect(calledUrl.searchParams.get("q")).toBe(expectedQuery);
  });

  it("returns empty on no results", async () => {
    (fetch as unknown as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    const client = new OpenLibraryClient();

    const result = await client.search({ keywords: ["anything"] });

    expect(result.count).toBe(0);
    expect(result.items).toEqual([]);
  });

  it("handles missing fields in results", async () => {
    const bookMock1 = {
      // missing 'key'
      author_name: ["Unknown Author"],
      title: "Unknown Book",
    };
    const bookMock2 = {
      key: "/works/OL2W",
      // missing 'author_name'
      title: "Mystery Title",
    };
    const bookMock3 = {
      key: "/works/OL3W",
      author_name: ["Author Three"],
      // missing 'title'
    };

    (fetch as unknown as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        num_found: 1,
        docs: [bookMock1, bookMock2, bookMock3],
      }),
    });

    const client = new OpenLibraryClient();

    const result = await client.search({ keywords: ["anything"] });

    const expectedBook1: Book = {
      id: "",
      title: "Unknown Book",
      authors: ["Unknown Author"],
    };
    const expectedBook2: Book = {
      id: "/works/OL2W",
      title: "Mystery Title",
      authors: [],
    };
    const expectedBook3: Book = {
      id: "/works/OL3W",
      title: "",
      authors: ["Author Three"],
    };

    expect(result.count).toBe(1);
    expect(result.items).toEqual([expectedBook1, expectedBook2, expectedBook3]);
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
