export interface Book {
  id: string;
  title: string;
  authors: string[];
}

export interface BookSearchResult {
  count: number;
  items: Book[];
}

export interface PaginatedResult<T> {
  page: number;
  limit: number;
  count: number;
  items: T[];
}
