import { Request, Response } from "express";

export const getRoot = (_req: Request, res: Response) => {
  res.json({ message: "Hello World!" });
};
