import express, { Request, Response } from "express";
import rootRouter from "./routes/root.routes";
import { logger } from "./middlewares/logger.middleware";

const app = express();

// Middleware
app.use(express.json());
app.use(logger);

// Routes
app.use("/", rootRouter);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

export { app };
