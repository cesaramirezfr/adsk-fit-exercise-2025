import express from "express";
import request from "supertest";
import { logger } from "../../middlewares/logger.middleware";

describe("logger middleware", () => {
  it("logs method, url, status, and duration", async () => {
    const app = express();
    app.use(logger);
    app.get("/ping", (_req, res) => res.status(200).send("ok"));

    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    await request(app).get("/ping").expect(200);

    expect(logSpy).toHaveBeenCalled();
    const msg = (logSpy.mock.calls.at(-1) ?? [])[0] as string;
    expect(msg).toContain("GET /ping 200");
    expect(msg).toMatch(/\d+ms/);

    logSpy.mockRestore();
  });
});
