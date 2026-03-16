// OpenClaw plugin API types (minimal subset)
export interface PluginApi {
  config: Record<string, string | undefined>;
  registerTool(definition: ToolDefinition): void;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: InputSchema;
  handler: (args: Record<string, any>) => Promise<ToolResult>;
}

export interface InputSchema {
  type: "object";
  properties: Record<string, PropertySchema>;
  required?: string[];
}

export interface PropertySchema {
  type: string;
  description?: string;
  enum?: string[];
  items?: { type: string };
  properties?: Record<string, PropertySchema>;
  additionalProperties?: boolean | PropertySchema;
}

export interface ToolResult {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
}

// Tallyman client types

export interface RequestOptions {
  query?: Record<string, string | number | undefined>;
  body?: Record<string, unknown>;
  accountId?: string;
}

export interface TallymanErrorData {
  status: number;
  message: string;
  retryAfter?: number;
}
