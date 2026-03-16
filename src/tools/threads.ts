import type { PluginApi } from "../types";
import type { TallymanClient } from "../client";

export function registerThreadTools(api: PluginApi, client: TallymanClient) {
  api.registerTool({
    name: "tallyman_list_threads",
    description: "List email threads/conversations",
    inputSchema: {
      type: "object",
      properties: {
        accountId: {
          type: "string",
          description:
            "Optional: ID of a specific connected inbox to use. Use tallyman_list_inboxes to see available inboxes. Omit to use default inbox.",
        },
        query: {
          type: "string",
          description: "Gmail search query (optional)",
        },
        maxResults: {
          type: "number",
          description: "Maximum number of threads to return (default: 10)",
        },
      },
    },
    handler: async (args) => {
      const result = await client.listThreads({
        q: args.query,
        maxResults: args.maxResults,
        accountId: args.accountId,
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  });

  api.registerTool({
    name: "tallyman_get_thread",
    description: "Get all messages in a conversation thread",
    inputSchema: {
      type: "object",
      properties: {
        accountId: {
          type: "string",
          description:
            "Optional: ID of a specific connected inbox to use. Use tallyman_list_inboxes to see available inboxes. Omit to use default inbox.",
        },
        threadId: {
          type: "string",
          description: "ID of the thread to retrieve",
        },
      },
      required: ["threadId"],
    },
    handler: async (args) => {
      const result = await client.getThread(args.threadId, {
        accountId: args.accountId,
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  });
}
