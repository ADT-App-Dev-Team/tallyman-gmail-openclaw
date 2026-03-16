# @tallyman/openclaw-gmail

OpenClaw plugin for accessing email inboxes through the [Tallyman](https://tallyman.io) API. Gmail-focused naming, but provider-agnostic internally (supports Gmail, Outlook, IMAP).

## Setup

```bash
bun install
bun run build
```

## Configuration

Set `TALLYMAN_API_KEY` environment variable, or pass `apiKey` in plugin config.

Optionally set `TALLYMAN_BASE_URL` (defaults to `https://api.tallyman.io`).

## Tools (17)

| Tool | Description |
|------|-------------|
| `tallyman_list_inboxes` | List connected email accounts |
| `tallyman_list_messages` | List recent emails |
| `tallyman_get_message` | Get email by ID |
| `tallyman_search_messages` | Search using Gmail query syntax |
| `tallyman_send_message` | Send a new email |
| `tallyman_reply_to_message` | Reply to an email |
| `tallyman_forward_message` | Forward an email |
| `tallyman_modify_message` | Modify labels (read/unread, star, archive) |
| `tallyman_trash_message` | Move to trash |
| `tallyman_list_labels` | List labels/folders |
| `tallyman_list_threads` | List conversation threads |
| `tallyman_get_thread` | Get full thread |
| `tallyman_create_draft` | Create a draft |
| `tallyman_list_drafts` | List drafts |
| `tallyman_list_attachments` | List attachments |
| `tallyman_list_services` | List vault services |
| `tallyman_service_proxy` | Proxy API calls through vault |

## Testing

```bash
bun test
```

## License

MIT
