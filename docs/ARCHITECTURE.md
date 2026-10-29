# Architecture

```text
React web dashboard ─────────┐
                             ├── HTTPS ── Express API ── MongoDB
Expo Android contact helper ─┘                 │
                                               ├── Contact/consent validation
                                               ├── Campaign drafts and reports
                                               └── SMS provider adapter (disabled by default)
```

## Core collections
- `User`: single owner account
- `Contact`: normalized phone, source, tags, consent status
- `Campaign`: content/template reference, status and recipient counts
- `MessageLog`: per-recipient provider status and attempts
- `ConsentEvent`: auditable consent/withdrawal history

## Sending lifecycle
Draft → Preview → Confirm → Queue → Provider submission → Delivery webhook → Report.

Do not equate “submitted” with “delivered”. A timeout after submission is ambiguous; reconcile using provider message IDs/status API before retrying. Use provider-supported idempotency where available.
