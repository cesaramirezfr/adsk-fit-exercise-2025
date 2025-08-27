import { Request, Response } from "express";
import { searchBooks } from "../services/book.service";
import { Book, PaginatedResult } from "../models/book.model";

const toKeywords = (q: unknown): string[] => {
  if (typeof q !== "string") {
    return [];
  }

  // split by spaces/commas; drop empties; basic sanitize
  return q
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 10); // cap to avoid huge queries
};

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

export const searchBooksController = async (req: Request, res: Response) => {
  const keywords = toKeywords(req.query.q);

  if (keywords.length === 0) {
    return res
      .status(400)
      .json({ error: "Query param 'q' is required (keywords)" });
  }

  const page = clamp(Number(req.query.page ?? 1) || 1, 1, 10000);
  const limit = clamp(Number(req.query.limit ?? 10) || 10, 1, 50);
  const match = (req.query.match === "all" ? "all" : "any") as "any" | "all";

  const results = await searchBooks({ keywords, page, limit, match });

  const response: PaginatedResult<Book> = {
    page,
    limit,
    count: results.count,
    items: results.items,
  };

  res.json(response);
};
