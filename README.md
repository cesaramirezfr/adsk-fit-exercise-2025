# adsk-fit-exercise-2025

Testable REST API with pnpm, Jest, ESLint (flat config), Prettier, Husky, and GitHub Actions. Includes `/books/search` powered by a pluggable OpenLibrary client.

---

## Requirements

- **Node 22 LTS**
- **pnpm 10+** (`corepack enable` recommended)

## Setup

```bash
pnpm install
pnpm dev         # start in dev (ts-node)
# http://localhost:3000
```

### Environment

No `.env` needed by default. Optional vars:

- `PORT` (default **3000**)
- `OPENLIBRARY_SEARCH_API` (default **[https://openlibrary.org/search.json](https://openlibrary.org/search.json)**)

---

## Scripts

```bash
pnpm dev           # run ts directly
pnpm build         # tsc -> dist/
pnpm start         # node dist/index.js
pnpm lint          # ESLint (flat config)
pnpm format        # Prettier
pnpm test          # Jest
pnpm test:cov      # Jest coverage (html + lcov + text)
```

---

## Project Structure (key parts)

```
src/
  app.ts                 # express app (importable for tests)
  index.ts               # server bootstrap
  constants.ts           # PORT, OPENLIBRARY_SEARCH_API
  controllers/
  routes/
  middlewares/           # logger, error handler
  models/                # Book
  clients/               # BooksExternalClient + OpenLibraryClient (DI)
  services/
  tests/
```

---

## API Endpoints

### Books search (OpenLibrary-backed)

```
GET /books/search?q=<kw1,kw2 or space-separated>&match=any|all&page=1&limit=10
→ { items: Book[], page, limit, count }
```

> The external API is abstracted behind `BooksExternalClient`. The real `OpenLibraryClient` is injected at boot (`setBooksClient(new OpenLibraryClient())`). In tests a fake is injected.

---

## Testing & Coverage

```bash
pnpm test
pnpm test:cov
# Open coverage report at coverage/lcov-report/index.html
```

- Network is **not** called in controller tests; a fake `BooksExternalClient` is injected.
- Unit tests cover:
  - `openlibrary.client.ts` (URL building, mapping, error path)
  - middlewares (logger + error)

---

## Linting & Formatting

```bash
pnpm lint
pnpm format
```

Prettier ignores `dist/`, `node_modules/`, and `pnpm-lock.yaml` via `.prettierignore`.

### Husky (pre-commit)

Project includes Husky to lint (and optionally test) on commit. To re-init locally:

```bash
pnpm dlx husky init
# edit .husky/pre-commit:
pnpm type-check
pnpm exec lint-staged
```

---

## CI (GitHub Actions)

Workflow: `.github/workflows/checks.yaml`

- **test** run tests
- Latest Node LTS, pnpm cache configured

Trigger: on PR to `main`.

---

## Deployment

### Production build (without Docker)

```bash
pnpm build
PORT=3000 pnpm start
```

### Docker (recommended)

`Dockerfile`

```Dockerfile
# ---- build stage ----
FROM node:22-alpine AS build
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# ---- runtime stage ----
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile
COPY --from=build /app/dist ./dist
ENV PORT=3000
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

`.dockerignore`

```
.git
.github
.husky
.vscode
coverage
dist
node_modules
```

Build & run:

```bash
docker build -t book-search-api .
docker run -p 3000:3000 --env PORT=3000 book-search-api
```

> Works on any container-friendly platform. Set env vars as needed.

---

## Notes on the OpenLibrary integration

- `OpenLibraryClient.search()` builds a boolean query across `title:` and `author:` fields using `match=any|all`, uses **Node 22 global `fetch`**, and maps minimal fields into `Book`.
- Swap in caching/retries/timeouts/auth as needed (wrap `fetch` or pass a custom client).
- For integration tests, inject the real client; for unit tests, inject a mock.

---

## Troubleshooting

- **ESM warnings**: configs are CJS (`jest.config.cjs`, `eslint.config.cjs`) to match `"type": "commonjs"`.
- **Port conflicts**: set `PORT=xxxx`.
- **Coverage missing**: ensure `collectCoverageFrom` in `jest.config.cjs` includes `src/**/*.ts` and excludes test files.

---

Happy shipping! 🛠️
