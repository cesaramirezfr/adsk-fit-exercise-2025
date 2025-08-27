import {
  setBooksClient,
  BooksExternalClient,
} from "../../clients/books.client";
import { app } from "../../app";
import request from "supertest";
import { ApiError } from "../../errors/api.error";

describe("Books search controller", () => {
  beforeAll(() => {
    const clientMock: BooksExternalClient = {
      async search({ keywords, page = 1, limit = 10, match = "any" }) {
        return {
          count: keywords.length,
          items: keywords.map((kw, i) => ({
            id: `/works/MOCK-${i}`,
            title: `Title ${kw}(${match}) [p${page} l${limit}]`,
            authors: [`Author ${kw}`],
          })),
        };
      },
    };
    setBooksClient(clientMock);
  });

  it("returns items for comma/space-separated keywords", async () => {
    const res = await request(app).get("/books/search?q=tolkien,hobbit");
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(2);
    expect(res.body.items[0].title).toContain("tolkien");
    expect(res.body.items[1].authors[0]).toContain("hobbit");
  });

  it("respects match=all and pagination", async () => {
    const res = await request(app).get(
      "/books/search?q=harry potter&match=all&page=2&limit=5",
    );
    expect(res.status).toBe(200);
    expect(res.body.page).toBe(2);
    expect(res.body.limit).toBe(5);
    expect(res.body.count).toBe(2);
    expect(res.body.items[0].title).toContain("(all)");
  });

  it("returns 400 when q is missing", async () => {
    const res = await request(app).get("/books/search");
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(res.body).not.toHaveProperty("items");
    expect(res.body.error).toMatch(/q/i);
  });

  it("returns an error when the client is not set", async () => {
    setBooksClient(null as unknown as BooksExternalClient); // unset client
    const res = await request(app).get("/books/search?q=anything");
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("error");
  });

  it("returns an error when the client throws", async () => {
    setBooksClient({
      async search() {
        throw new ApiError(429, "Rate limit exceeded", "Too many requests");
      },
    });
    const res = await request(app).get("/books/search?q=anything");
    expect(res.status).toBe(429);
    expect(res.body).toHaveProperty("error");
    expect(res.body).toHaveProperty("details");
  });
});
