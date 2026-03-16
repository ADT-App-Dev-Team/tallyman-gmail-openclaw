import type { PluginApi } from "../types";
import type { TallymanClient } from "../client";

export function registerSearchTools(api: PluginApi, client: TallymanClient) {
  api.registerTool({
    name: "tallyman_search_messages",
    description:
      "Search emails using Gmail query syntax (e.g., from:john, subject:invoice, is:unread)",
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
          description: "Gmail search query",
        },
        maxResults: {
          type: "number",
          description: "Maximum number of messages to return (default: 10)",
        },
      },
      required: ["query"],
    },
    handler: async (args) => {
      const result = await client.searchMessages({
        q: args.query,
        limit: args.maxResults,
        accountId: args.accountId,
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  });
}
