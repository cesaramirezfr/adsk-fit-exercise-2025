import express, { NextFunction, Request, Response } from "express";
import request from "supertest";
import { errorHandler } from "../../middlewares/error.middleware";
import { ApiError } from "../../errors/api.error";

describe("error middleware", () => {
  const appFactory = () => {
    const app = express();

    app.get("/api-error", (_req: Request, _res: Response) => {
      throw new ApiError(418, "teapot", { hint: "add water" });
    });

    app.get("/unexpected", (_req: Request, _res: Response) => {
      throw new Error("boom");
    });

    app.get(
      "/next-api-error",
      (_req: Request, _res: Response, next: NextFunction) => {
        next(new ApiError(400, "bad input"));
      },
    );

    app.use(errorHandler);
    return app;
  };

  it("formats ApiError with status and details", async () => {
    const app = appFactory();
    const res = await request(app).get("/api-error");
    expect(res.status).toBe(418);
    expect(res.body.error).toBe("teapot");
    expect(res.body.details).toBeDefined();
  });

  it("returns 500 on unexpected error and logs it", async () => {
    const app = appFactory();
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const res = await request(app).get("/unexpected");
    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Internal Server Error");
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it("handles ApiError passed via next()", async () => {
    const app = appFactory();
    const res = await request(app).get("/next-api-error");
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("bad input");
  });
});
