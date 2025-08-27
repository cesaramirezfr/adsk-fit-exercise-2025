describe("infra/redis", () => {
  const mockRedisUrl = "redis://test:6379";
  process.env.REDIS_URL = mockRedisUrl;

  beforeEach(() => {
    jest.resetModules(); // ensure fresh module state per test
  });

  it("connects only once and registers an error handler", async () => {
    const mockConnect = jest.fn(async function (this: any) {
      this.isOpen = true;
    });
    const mockQuit = jest.fn(async function (this: any) {
      this.isOpen = false;
    });

    const fakeClient: any = {
      isOpen: false,
      connect: mockConnect,
      quit: mockQuit,
    };

    const createClient = jest.fn(() => fakeClient);

    jest.doMock("redis", () => ({ createClient }), { virtual: true });

    const { connectRedis, disconnectRedis } = await import("../../infra/redis");

    // First connect
    await connectRedis();
    expect(createClient).toHaveBeenCalledWith({ url: mockRedisUrl });
    expect(mockConnect).toHaveBeenCalledTimes(1);

    // Second connect is a no-op
    await connectRedis();
    expect(mockConnect).toHaveBeenCalledTimes(1);

    // Disconnect closes the client
    await disconnectRedis();
    expect(mockQuit).toHaveBeenCalledTimes(1);
  });

  it("disconnect is a no-op when not open", async () => {
    const mockConnect = jest.fn(async function (this: any) {
      this.isOpen = true;
    });
    const mockQuit = jest.fn(async function (this: any) {
      this.isOpen = false;
    });

    const fakeClient: any = {
      isOpen: false,
      connect: mockConnect,
      quit: mockQuit,
    };

    const createClient = jest.fn(() => fakeClient);

    jest.doMock("redis", () => ({ createClient }), { virtual: true });

    const { disconnectRedis } = await import("../../infra/redis");

    await disconnectRedis();
    expect(mockQuit).not.toHaveBeenCalled();
  });
});
