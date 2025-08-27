import { app } from "./app";
import { setBooksClient } from "./clients/books.client";
import { RedisCachedBooksClient } from "./clients/cached-books.client";
import { OpenLibraryClient } from "./clients/openlibrary.client";
import { PORT, CACHE_TTL } from "./constants";
import { connectRedis, disconnectRedis, redis } from "./infra/redis";

async function main() {
  try {
    await connectRedis();
    setBooksClient(
      new RedisCachedBooksClient(redis, new OpenLibraryClient(), {
        ttlSeconds: CACHE_TTL,
      }),
    );
    console.log("[boot] ✅ Redis cache enabled");
  } catch {
    console.error("[boot] ❌ Redis unavailable, continuing without cache");
  }

  const server = app.listen(PORT, () => {
    console.log(`🚀 Server is running at http://localhost:${PORT}`);
  });

  const shutdown = async () => {
    server.close();
    await disconnectRedis().catch(() => {});
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

if (require.main === module) {
  main();
}
