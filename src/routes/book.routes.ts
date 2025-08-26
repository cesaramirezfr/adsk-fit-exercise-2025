import { Router } from "express";
import { searchBooksController } from "../controllers/book.controller";

const router = Router();

router.get("/search", searchBooksController);

export default router;
