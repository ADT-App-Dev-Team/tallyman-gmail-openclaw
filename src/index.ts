import type { PluginApi } from "./types";
import { TallymanClient } from "./client";
import { registerAccountTools } from "./tools/accounts";
import { registerMessageTools } from "./tools/messages";
import { registerSearchTools } from "./tools/search";
import { registerLabelTools } from "./tools/labels";
import { registerThreadTools } from "./tools/threads";
import { registerDraftTools } from "./tools/drafts";
import { registerAttachmentTools } from "./tools/attachments";
import { registerServiceTools } from "./tools/services";

export default {
  id: "openclaw-gmail",
  register(api: PluginApi) {
    const baseUrl =
      api.config.baseUrl ||
      process.env.TALLYMAN_BASE_URL ||
      "https://api.tallyman.io";

    const apiKey = api.config.apiKey || process.env.TALLYMAN_API_KEY;

    if (!apiKey) {
      throw new Error(
        "Tallyman API key required. Set TALLYMAN_API_KEY env var or pass apiKey in plugin config.",
      );
    }

    const client = new TallymanClient(baseUrl, apiKey);

    registerAccountTools(api, client);
    registerMessageTools(api, client);
    registerSearchTools(api, client);
    registerLabelTools(api, client);
    registerThreadTools(api, client);
    registerDraftTools(api, client);
    registerAttachmentTools(api, client);
    registerServiceTools(api, client);
  },
};

export { TallymanClient, TallymanError } from "./client";
export type { PluginApi, ToolDefinition, ToolResult } from "./types";
