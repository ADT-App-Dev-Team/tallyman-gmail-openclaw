import type { PluginApi } from "../types";
import type { TallymanClient } from "../client";

export function registerDraftTools(api: PluginApi, client: TallymanClient) {
  api.registerTool({
    name: "tallyman_create_draft",
    description: "Create a draft email",
    inputSchema: {
      type: "object",
      properties: {
        accountId: {
          type: "string",
          description:
            "Optional: ID of a specific connected inbox to use. Use tallyman_list_inboxes to see available inboxes. Omit to use default inbox.",
        },
        to: { type: "string", description: "Recipient email address" },
        subject: { type: "string", description: "Email subject" },
        body: { type: "string", description: "Email body (HTML supported)" },
        cc: { type: "string", description: "CC recipients (optional)" },
        bcc: { type: "string", description: "BCC recipients (optional)" },
      },
      required: ["to", "subject", "body"],
    },
    handler: async (args) => {
      const result = await client.createDraft({
        to: args.to,
        subject: args.subject,
        body: args.body,
        cc: args.cc,
        bcc: args.bcc,
        accountId: args.accountId,
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  });

  api.registerTool({
    name: "tallyman_list_drafts",
    description: "List all draft emails",
    inputSchema: {
      type: "object",
      properties: {
        accountId: {
          type: "string",
          description:
            "Optional: ID of a specific connected inbox to use. Use tallyman_list_inboxes to see available inboxes. Omit to use default inbox.",
        },
        maxResults: {
          type: "number",
          description: "Maximum number of drafts to return (default: 10)",
        },
      },
    },
    handler: async (args) => {
      const result = await client.listDrafts({
        maxResults: args.maxResults,
        accountId: args.accountId,
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  });
}
