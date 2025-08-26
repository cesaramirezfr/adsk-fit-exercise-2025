import express from "express";
import bookRouter from "./routes/book.routes";
import { logger, errorHandler, notFoundHandler } from "./middlewares";
import { setBooksClient } from "./clients/books.client";
import { OpenLibraryClient } from "./clients/openlibrary.client";

setBooksClient(new OpenLibraryClient());

const app = express();

app.use(express.json());
app.use(logger);

app.use("/books", bookRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export { app };
