import { Request, Response, NextFunction } from "express";
import { IS_TEST_ENV } from "../constants";

export const logger = (req: Request, res: Response, next: NextFunction) => {
  if (IS_TEST_ENV) {
    return next();
  }

  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const log = `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`;
    console.log(log);
  });

  next();
};
