import type { Book } from "../models/book.model";
import { getBooksClient } from "../clients/books.client";

export async function searchBooks(params: {
  keywords: string[];
  page?: number;
  limit?: number;
  match?: "any" | "all";
}): Promise<Book[]> {
  const client = getBooksClient();

  return client.search(params);
}
