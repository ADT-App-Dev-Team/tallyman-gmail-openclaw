import type { PluginApi } from "../types";
import type { TallymanClient } from "../client";

export function registerAttachmentTools(api: PluginApi, client: TallymanClient) {
  api.registerTool({
    name: "tallyman_list_attachments",
    description: "List attachments for a specific email",
    inputSchema: {
      type: "object",
      properties: {
        accountId: {
          type: "string",
          description:
            "Optional: ID of a specific connected inbox to use. Use tallyman_list_inboxes to see available inboxes. Omit to use default inbox.",
        },
        messageId: {
          type: "string",
          description: "ID of the message",
        },
      },
      required: ["messageId"],
    },
    handler: async (args) => {
      const result = await client.listAttachments(args.messageId, {
        accountId: args.accountId,
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  });
}
