import type { RequestOptions, TallymanErrorData } from "./types";

export class TallymanError extends Error {
  status: number;
  retryAfter?: number;

  constructor(data: TallymanErrorData) {
    super(data.message);
    this.name = "TallymanError";
    this.status = data.status;
    this.retryAfter = data.retryAfter;
  }
}

export class TallymanClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.apiKey = apiKey;
  }

  private async request<T = unknown>(
    method: string,
    path: string,
    opts: RequestOptions = {},
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);

    if (opts.accountId) {
      url.searchParams.set("accountId", opts.accountId);
    }
    if (opts.query) {
      for (const [key, value] of Object.entries(opts.query)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };

    const response = await fetch(url.toString(), {
      method,
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });

    if (!response.ok) {
      const text = await response.text();
      let message: string;

      try {
        const json = JSON.parse(text);
        message = json.error ?? json.message ?? text;
      } catch {
        message = text;
      }

      switch (response.status) {
        case 401:
          message = "Authentication failed. Check your Tallyman API key.";
          break;
        case 403:
          // Pass through IAM denial message
          break;
        case 429:
          throw new TallymanError({
            status: 429,
            message: `Rate limited. ${message}`,
            retryAfter: response.headers.get("Retry-After")
              ? Number(response.headers.get("Retry-After")) * 1000
              : undefined,
          });
        default:
          if (response.status >= 500) {
            message = `Tallyman service error (${response.status}): ${message}`;
          }
      }

      throw new TallymanError({ status: response.status, message });
    }

    return response.json() as Promise<T>;
  }

  // ==================
  // Inbox Accounts
  // ==================

  listInboxes() {
    return this.request("GET", "/api/inbox/accounts");
  }

  // ==================
  // Messages
  // ==================

  listMessages(opts: {
    limit?: number;
    accountId?: string;
    afterDate?: string;
    beforeDate?: string;
  } = {}) {
    return this.request("GET", "/api/inbox/message", {
      accountId: opts.accountId,
      query: {
        limit: opts.limit,
        afterDate: opts.afterDate,
        beforeDate: opts.beforeDate,
      },
    });
  }

  getMessage(messageId: string, opts: { accountId?: string } = {}) {
    return this.request("GET", `/api/inbox/message/${encodeURIComponent(messageId)}`, {
      accountId: opts.accountId,
    });
  }

  searchMessages(opts: {
    q: string;
    limit?: number;
    accountId?: string;
    afterDate?: string;
    beforeDate?: string;
  }) {
    return this.request("GET", "/api/inbox/search", {
      accountId: opts.accountId,
      query: {
        q: opts.q,
        limit: opts.limit,
        afterDate: opts.afterDate,
        beforeDate: opts.beforeDate,
      },
    });
  }

  // ==================
  // Send / Reply / Forward
  // ==================

  sendMessage(body: {
    to: string;
    subject: string;
    body: string;
    cc?: string;
    bcc?: string;
    accountId?: string;
  }) {
    const { accountId, ...rest } = body;
    return this.request("POST", "/api/inbox/message", {
      accountId,
      body: rest,
    });
  }

  replyToMessage(messageId: string, body: {
    body: string;
    cc?: string;
    bcc?: string;
    accountId?: string;
  }) {
    const { accountId, ...rest } = body;
    return this.request("POST", `/api/inbox/message/${encodeURIComponent(messageId)}/reply`, {
      accountId,
      body: rest,
    });
  }

  forwardMessage(messageId: string, body: {
    to: string;
    body?: string;
    cc?: string;
    bcc?: string;
    accountId?: string;
  }) {
    const { accountId, ...rest } = body;
    return this.request("POST", `/api/inbox/message/${encodeURIComponent(messageId)}/forward`, {
      accountId,
      body: rest,
    });
  }

  // ==================
  // Modify / Trash
  // ==================

  modifyMessage(messageId: string, body: {
    addLabelIds?: string[];
    removeLabelIds?: string[];
    accountId?: string;
  }) {
    const { accountId, ...rest } = body;
    return this.request("PATCH", `/api/inbox/message/${encodeURIComponent(messageId)}`, {
      accountId,
      body: rest,
    });
  }

  trashMessage(messageId: string, opts: { accountId?: string } = {}) {
    return this.request("DELETE", `/api/inbox/message/${encodeURIComponent(messageId)}`, {
      accountId: opts.accountId,
    });
  }

  // ==================
  // Labels
  // ==================

  listLabels(opts: { accountId?: string } = {}) {
    return this.request("GET", "/api/inbox/label", {
      accountId: opts.accountId,
    });
  }

  // ==================
  // Threads
  // ==================

  listThreads(opts: {
    q?: string;
    maxResults?: number;
    accountId?: string;
  } = {}) {
    return this.request("GET", "/api/inbox/thread", {
      accountId: opts.accountId,
      query: { q: opts.q, maxResults: opts.maxResults },
    });
  }

  getThread(threadId: string, opts: { accountId?: string } = {}) {
    return this.request("GET", `/api/inbox/thread/${encodeURIComponent(threadId)}`, {
      accountId: opts.accountId,
    });
  }

  // ==================
  // Drafts
  // ==================

  createDraft(body: {
    to: string;
    subject: string;
    body: string;
    cc?: string;
    bcc?: string;
    accountId?: string;
  }) {
    const { accountId, ...rest } = body;
    return this.request("POST", "/api/inbox/draft", {
      accountId,
      body: rest,
    });
  }

  listDrafts(opts: { maxResults?: number; accountId?: string } = {}) {
    return this.request("GET", "/api/inbox/draft", {
      accountId: opts.accountId,
      query: { maxResults: opts.maxResults },
    });
  }

  // ==================
  // Attachments
  // ==================

  listAttachments(messageId: string, opts: { accountId?: string } = {}) {
    return this.request("GET", `/api/inbox/message/${encodeURIComponent(messageId)}/attachment`, {
      accountId: opts.accountId,
    });
  }

  // ==================
  // Vault
  // ==================

  listServices() {
    return this.request("GET", "/api/vault/services");
  }

  serviceProxy(body: {
    service: string;
    method: string;
    path: string;
    headers?: Record<string, string>;
    body?: string;
  }) {
    return this.request("POST", "/api/vault/proxy", { body });
  }
}
