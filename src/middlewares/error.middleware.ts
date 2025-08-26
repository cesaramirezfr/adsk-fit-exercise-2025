import { Request, Response, NextFunction } from "express";
import { ApiError } from "../errors/api.error";

export const errorHandler = (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      error: error.message,
      details: error.details,
    });
  }
  console.error("Unexpected error:", error);
  return res.status(500).json({
    error: "Internal Server Error",
  });
};
