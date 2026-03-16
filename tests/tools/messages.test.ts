import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PluginApi, ToolDefinition } from "../../src/types";
import { TallymanClient } from "../../src/client";
import { registerMessageTools } from "../../src/tools/messages";

const BASE_URL = "https://api.tallyman.io";
const API_KEY = "tk_test_123";

let tools: Map<string, ToolDefinition>;
let client: TallymanClient;

function mockFetch(body: unknown = {}) {
  return vi.spyOn(globalThis, "fetch").mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
    headers: new Headers(),
  } as Response);
}

beforeEach(() => {
  vi.restoreAllMocks();
  tools = new Map();
  client = new TallymanClient(BASE_URL, API_KEY);

  const api: PluginApi = {
    config: {},
    registerTool(def: ToolDefinition) {
      tools.set(def.name, def);
    },
  };

  registerMessageTools(api, client);
});

describe("message tools", () => {
  it("registers all 7 message tools", () => {
    expect(tools.size).toBe(7);
    expect(tools.has("tallyman_list_messages")).toBe(true);
    expect(tools.has("tallyman_get_message")).toBe(true);
    expect(tools.has("tallyman_send_message")).toBe(true);
    expect(tools.has("tallyman_reply_to_message")).toBe(true);
    expect(tools.has("tallyman_forward_message")).toBe(true);
    expect(tools.has("tallyman_modify_message")).toBe(true);
    expect(tools.has("tallyman_trash_message")).toBe(true);
  });

  it("tallyman_list_messages calls correct endpoint", async () => {
    const spy = mockFetch([{ id: "msg_1" }]);
    const tool = tools.get("tallyman_list_messages")!;
    const result = await tool.handler({ maxResults: 5 });

    expect(spy).toHaveBeenCalledOnce();
    const [url] = spy.mock.calls[0];
    expect(url).toContain("/api/inbox/message");
    expect(url).toContain("limit=5");
    expect(result.content[0].type).toBe("text");
    expect(JSON.parse(result.content[0].text)).toEqual([{ id: "msg_1" }]);
  });

  it("tallyman_get_message includes messageId in path", async () => {
    const spy = mockFetch({ id: "msg_1", subject: "Test" });
    const tool = tools.get("tallyman_get_message")!;
    await tool.handler({ messageId: "msg_1" });

    const [url] = spy.mock.calls[0];
    expect(url).toContain("/api/inbox/message/msg_1");
  });

  it("tallyman_send_message sends POST with body", async () => {
    const spy = mockFetch({ id: "sent_1" });
    const tool = tools.get("tallyman_send_message")!;
    await tool.handler({
      to: "alice@example.com",
      subject: "Hello",
      body: "Hi there",
    });

    const [url, init] = spy.mock.calls[0];
    expect(url).toContain("/api/inbox/message");
    expect(init?.method).toBe("POST");
    const body = JSON.parse(init?.body as string);
    expect(body.to).toBe("alice@example.com");
    expect(body.subject).toBe("Hello");
  });

  it("tallyman_reply_to_message uses correct path", async () => {
    const spy = mockFetch({});
    const tool = tools.get("tallyman_reply_to_message")!;
    await tool.handler({ messageId: "msg_1", body: "Thanks!" });

    const [url, init] = spy.mock.calls[0];
    expect(url).toContain("/api/inbox/message/msg_1/reply");
    expect(init?.method).toBe("POST");
  });

  it("tallyman_forward_message uses correct path", async () => {
    const spy = mockFetch({});
    const tool = tools.get("tallyman_forward_message")!;
    await tool.handler({ messageId: "msg_1", to: "bob@example.com" });

    const [url, init] = spy.mock.calls[0];
    expect(url).toContain("/api/inbox/message/msg_1/forward");
    expect(init?.method).toBe("POST");
  });

  it("tallyman_modify_message sends PATCH", async () => {
    const spy = mockFetch({});
    const tool = tools.get("tallyman_modify_message")!;
    await tool.handler({ messageId: "msg_1", addLabelIds: ["STARRED"] });

    const [, init] = spy.mock.calls[0];
    expect(init?.method).toBe("PATCH");
  });

  it("tallyman_trash_message sends DELETE", async () => {
    const spy = mockFetch({});
    const tool = tools.get("tallyman_trash_message")!;
    await tool.handler({ messageId: "msg_1" });

    const [url, init] = spy.mock.calls[0];
    expect(url).toContain("/api/inbox/message/msg_1");
    expect(init?.method).toBe("DELETE");
  });

  it("passes accountId through to client", async () => {
    const spy = mockFetch([]);
    const tool = tools.get("tallyman_list_messages")!;
    await tool.handler({ accountId: "acc_456" });

    const [url] = spy.mock.calls[0];
    expect(url).toContain("accountId=acc_456");
  });
});
