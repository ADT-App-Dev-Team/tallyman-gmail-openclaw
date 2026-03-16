import type { PluginApi } from "../types";
import type { TallymanClient } from "../client";

export function registerServiceTools(api: PluginApi, client: TallymanClient) {
  api.registerTool({
    name: "tallyman_list_services",
    description:
      "List all configured custom API services (names and base URLs, never secrets)",
    inputSchema: {
      type: "object",
      properties: {},
    },
    handler: async () => {
      const result = await client.listServices();
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  });

  api.registerTool({
    name: "tallyman_service_proxy",
    description:
      "Make an API call through the Tallyman proxy. Tallyman injects the credentials server-side — the agent never sees the real secrets.",
    inputSchema: {
      type: "object",
      properties: {
        service: {
          type: "string",
          description: "Service name (e.g. 'stripe')",
        },
        method: {
          type: "string",
          enum: ["GET", "POST", "PUT", "PATCH", "DELETE"],
          description: "HTTP method",
        },
        path: {
          type: "string",
          description: "API path (e.g. '/v1/charges')",
        },
        headers: {
          type: "object",
          description: "Optional extra headers",
          properties: {},
          additionalProperties: { type: "string" },
        },
        body: {
          type: "string",
          description: "Optional request body (JSON string)",
        },
      },
      required: ["service", "method", "path"],
    },
    handler: async (args) => {
      const result = await client.serviceProxy({
        service: args.service,
        method: args.method,
        path: args.path,
        headers: args.headers,
        body: args.body,
      });
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  });
}
