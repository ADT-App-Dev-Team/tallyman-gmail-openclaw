import { describe, it, expect, vi, beforeEach } from "vitest";
import { TallymanClient, TallymanError } from "../src/client";

const BASE_URL = "https://api.tallyman.io";
const API_KEY = "tk_test_123";

let client: TallymanClient;

beforeEach(() => {
  client = new TallymanClient(BASE_URL, API_KEY);
  vi.restoreAllMocks();
});

function mockFetch(response: { status?: number; body?: unknown; headers?: Record<string, string> }) {
  const status = response.status ?? 200;
  const ok = status >= 200 && status < 300;
  return vi.spyOn(globalThis, "fetch").mockResolvedValue({
    ok,
    status,
    json: () => Promise.resolve(response.body),
    text: () => Promise.resolve(JSON.stringify(response.body ?? "")),
    headers: new Headers(response.headers ?? {}),
  } as Response);
}

describe("TallymanClient", () => {
  describe("request building", () => {
    it("sends correct auth header", async () => {
      const spy = mockFetch({ body: [] });
      await client.listInboxes();

      expect(spy).toHaveBeenCalledOnce();
      const [url, init] = spy.mock.calls[0];
      expect(init?.headers).toEqual(
        expect.objectContaining({ Authorization: "Bearer tk_test_123" }),
      );
      expect(url).toBe("https://api.tallyman.io/api/inbox/accounts");
    });

    it("includes accountId as query param", async () => {
      const spy = mockFetch({ body: [] });
      await client.listMessages({ accountId: "acc_123" });

      const [url] = spy.mock.calls[0];
      expect(url).toContain("accountId=acc_123");
    });

    it("includes query params for list endpoints", async () => {
      const spy = mockFetch({ body: [] });
      await client.listMessages({ limit: 5, afterDate: "2024-01-01" });

      const [url] = spy.mock.calls[0];
      expect(url).toContain("limit=5");
      expect(url).toContain("afterDate=2024-01-01");
    });

    it("sends JSON body for POST requests", async () => {
      const spy = mockFetch({ body: { id: "msg_1" } });
      await client.sendMessage({
        to: "test@example.com",
        subject: "Test",
        body: "<p>Hello</p>",
      });

      const [url, init] = spy.mock.calls[0];
      expect(url).toBe("https://api.tallyman.io/api/inbox/message");
      expect(init?.method).toBe("POST");
      expect(JSON.parse(init?.body as string)).toEqual({
        to: "test@example.com",
        subject: "Test",
        body: "<p>Hello</p>",
      });
    });

    it("URL-encodes path parameters", async () => {
      const spy = mockFetch({ body: {} });
      await client.getMessage("msg/with/slashes");

      const [url] = spy.mock.calls[0];
      expect(url).toContain("msg%2Fwith%2Fslashes");
    });
  });

  describe("method routing", () => {
    it("GET for listMessages", async () => {
      const spy = mockFetch({ body: [] });
      await client.listMessages();
      expect(spy.mock.calls[0][1]?.method).toBe("GET");
    });

    it("POST for replyToMessage", async () => {
      const spy = mockFetch({ body: {} });
      await client.replyToMessage("msg_1", { body: "reply" });
      const [url, init] = spy.mock.calls[0];
      expect(init?.method).toBe("POST");
      expect(url).toContain("/api/inbox/message/msg_1/reply");
    });

    it("PATCH for modifyMessage", async () => {
      const spy = mockFetch({ body: {} });
      await client.modifyMessage("msg_1", { addLabelIds: ["STARRED"] });
      expect(spy.mock.calls[0][1]?.method).toBe("PATCH");
    });

    it("DELETE for trashMessage", async () => {
      const spy = mockFetch({ body: {} });
      await client.trashMessage("msg_1");
      expect(spy.mock.calls[0][1]?.method).toBe("DELETE");
    });

    it("GET for listThreads with query param", async () => {
      const spy = mockFetch({ body: [] });
      await client.listThreads({ q: "from:me", maxResults: 5 });
      const [url] = spy.mock.calls[0];
      expect(url).toContain("q=from%3Ame");
      expect(url).toContain("maxResults=5");
    });

    it("POST for serviceProxy", async () => {
      const spy = mockFetch({ body: {} });
      await client.serviceProxy({
        service: "stripe",
        method: "GET",
        path: "/v1/charges",
      });
      const [url, init] = spy.mock.calls[0];
      expect(url).toBe("https://api.tallyman.io/api/vault/proxy");
      expect(init?.method).toBe("POST");
    });
  });

  describe("error handling", () => {
    it("maps 401 to auth error", async () => {
      mockFetch({ status: 401, body: { error: "Invalid token" } });
      await expect(client.listInboxes()).rejects.toThrow(
        "Authentication failed. Check your Tallyman API key.",
      );
    });

    it("passes through 403 IAM denial", async () => {
      mockFetch({
        status: 403,
        body: { error: "Principal not authorized to perform email:SendMessage" },
      });
      await expect(client.sendMessage({ to: "a", subject: "b", body: "c" })).rejects.toThrow(
        "Principal not authorized",
      );
    });

    it("maps 429 with Retry-After", async () => {
      mockFetch({
        status: 429,
        body: { error: "Too many requests" },
        headers: { "Retry-After": "30" },
      });

      try {
        await client.listMessages();
        expect.unreachable("should throw");
      } catch (e) {
        expect(e).toBeInstanceOf(TallymanError);
        expect((e as TallymanError).status).toBe(429);
        expect((e as TallymanError).retryAfter).toBe(30000);
      }
    });

    it("maps 500 to service error", async () => {
      mockFetch({ status: 500, body: { error: "Internal" } });
      await expect(client.listInboxes()).rejects.toThrow("Tallyman service error");
    });
  });
});
