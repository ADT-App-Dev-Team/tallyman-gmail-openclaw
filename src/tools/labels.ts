import type { PluginApi } from "../types";
import type { TallymanClient } from "../client";

export function registerLabelTools(api: PluginApi, client: TallymanClient) {
  api.registerTool({
    name: "tallyman_list_labels",
    description: "List all available labels/folders",
    inputSchema: {
      type: "object",
      properties: {
        accountId: {
          type: "string",
          description:
            "Optional: ID of a specific connected inbox to use. Use tallyman_list_inboxes to see available inboxes. Omit to use default inbox.",
        },
      },
    },
    handler: async (args) => {
      const result = await client.listLabels({ accountId: args.accountId });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  });
}
