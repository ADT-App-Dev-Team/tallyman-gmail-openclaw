import type { PluginApi } from "../types";
import type { TallymanClient } from "../client";

const ACCOUNT_ID_PROP = {
  accountId: {
    type: "string",
    description:
      "Optional: ID of a specific connected inbox to use. Use tallyman_list_inboxes to see available inboxes. Omit to use default inbox.",
  },
} as const;

export function registerMessageTools(api: PluginApi, client: TallymanClient) {
  api.registerTool({
    name: "tallyman_list_messages",
    description: "List recent emails from the inbox",
    inputSchema: {
      type: "object",
      properties: {
        ...ACCOUNT_ID_PROP,
        maxResults: {
          type: "number",
          description: "Maximum number of messages to return (default: 10)",
        },
      },
    },
    handler: async (args) => {
      const result = await client.listMessages({
        limit: args.maxResults,
        accountId: args.accountId,
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  });

  api.registerTool({
    name: "tallyman_get_message",
    description: "Get a specific email by ID",
    inputSchema: {
      type: "object",
      properties: {
        ...ACCOUNT_ID_PROP,
        messageId: {
          type: "string",
          description: "The ID of the message to retrieve",
        },
      },
      required: ["messageId"],
    },
    handler: async (args) => {
      const result = await client.getMessage(args.messageId, {
        accountId: args.accountId,
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  });

  api.registerTool({
    name: "tallyman_send_message",
    description: "Send a new email",
    inputSchema: {
      type: "object",
      properties: {
        ...ACCOUNT_ID_PROP,
        to: { type: "string", description: "Recipient email address" },
        subject: { type: "string", description: "Email subject" },
        body: { type: "string", description: "Email body (HTML supported)" },
        cc: { type: "string", description: "CC recipients (optional)" },
        bcc: { type: "string", description: "BCC recipients (optional)" },
      },
      required: ["to", "subject", "body"],
    },
    handler: async (args) => {
      const result = await client.sendMessage({
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
    name: "tallyman_reply_to_message",
    description: "Reply to an existing email thread",
    inputSchema: {
      type: "object",
      properties: {
        ...ACCOUNT_ID_PROP,
        messageId: {
          type: "string",
          description: "ID of the message to reply to",
        },
        body: { type: "string", description: "Reply body (HTML supported)" },
        cc: { type: "string", description: "CC recipients (optional)" },
        bcc: { type: "string", description: "BCC recipients (optional)" },
      },
      required: ["messageId", "body"],
    },
    handler: async (args) => {
      const result = await client.replyToMessage(args.messageId, {
        body: args.body,
        cc: args.cc,
        bcc: args.bcc,
        accountId: args.accountId,
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  });

  api.registerTool({
    name: "tallyman_forward_message",
    description: "Forward an email to another recipient",
    inputSchema: {
      type: "object",
      properties: {
        ...ACCOUNT_ID_PROP,
        messageId: {
          type: "string",
          description: "ID of the message to forward",
        },
        to: { type: "string", description: "Recipient email address" },
        body: {
          type: "string",
          description: "Additional message to include (optional)",
        },
        cc: { type: "string", description: "CC recipients (optional)" },
        bcc: { type: "string", description: "BCC recipients (optional)" },
      },
      required: ["messageId", "to"],
    },
    handler: async (args) => {
      const result = await client.forwardMessage(args.messageId, {
        to: args.to,
        body: args.body,
        cc: args.cc,
        bcc: args.bcc,
        accountId: args.accountId,
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  });

  api.registerTool({
    name: "tallyman_modify_message",
    description:
      "Modify message labels (mark read/unread, star, archive, etc.)",
    inputSchema: {
      type: "object",
      properties: {
        ...ACCOUNT_ID_PROP,
        messageId: {
          type: "string",
          description: "ID of the message to modify",
        },
        addLabelIds: {
          type: "array",
          items: { type: "string" },
          description: "Labels to add (e.g., STARRED, IMPORTANT, UNREAD)",
        },
        removeLabelIds: {
          type: "array",
          items: { type: "string" },
          description: "Labels to remove (e.g., UNREAD, INBOX for archive)",
        },
      },
      required: ["messageId"],
    },
    handler: async (args) => {
      const result = await client.modifyMessage(args.messageId, {
        addLabelIds: args.addLabelIds,
        removeLabelIds: args.removeLabelIds,
        accountId: args.accountId,
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  });

  api.registerTool({
    name: "tallyman_trash_message",
    description: "Move an email to trash",
    inputSchema: {
      type: "object",
      properties: {
        ...ACCOUNT_ID_PROP,
        messageId: {
          type: "string",
          description: "ID of the message to trash",
        },
      },
      required: ["messageId"],
    },
    handler: async (args) => {
      const result = await client.trashMessage(args.messageId, {
        accountId: args.accountId,
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  });
}
