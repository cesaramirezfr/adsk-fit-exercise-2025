export const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
export const OPENLIBRARY_SEARCH_API = "https://openlibrary.org/search.json";
export const CACHE_TTL = Number(process.env.CACHE_TTL ?? 60 * 60); // 1 hour in seconds
export const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";
