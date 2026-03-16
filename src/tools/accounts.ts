import type { PluginApi } from "../types";
import type { TallymanClient } from "../client";

export function registerAccountTools(api: PluginApi, client: TallymanClient) {
  api.registerTool({
    name: "tallyman_list_inboxes",
    description:
      "List all connected email inboxes/accounts for the current user",
    inputSchema: {
      type: "object",
      properties: {},
    },
    handler: async () => {
      const result = await client.listInboxes();
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  });
}
