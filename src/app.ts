import express from "express";
import rootRouter from "./routes/root.routes";
import { logger, errorHandler, notFoundHandler } from "./middlewares";

const app = express();

app.use(express.json());
app.use(logger);

app.use("/", rootRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export { app };
