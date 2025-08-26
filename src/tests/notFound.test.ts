import request from "supertest";
import { app } from "../app";

describe("GET /does-not-exist", () => {
  it("should return 404", async () => {
    const res = await request(app).get("/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
    expect(res.body).not.toHaveProperty("message");
  });
});
