# Lead Follow-up Agent — Phase 0+1 (Foundation)

This is the foundation for the autonomous lead follow-up agent: it lets lead
replies **enter** the system, matches each reply to the exact tenant + lead that
sent the original email, classifies it (Norwegian + English), stores it, and
applies the "stop on negative" guardrail. Draft generation, the inbox UI, and
auto-send are later phases.

## What ships in this phase

- `server/services/replyClassifier.ts` — pure classifier (11 categories,
  confidence, sentiment, suggested action) + quoted-history stripping.
- `server/services/replyAddress.ts` — signed per-(tenant, lead) reply addresses
  (`reply+{userId}-{leadId}-{token}@REPLY_DOMAIN`), HMAC-keyed by `APP_SECRET`.
- `server/services/inboundAgent.ts` — ingest → match → classify → store →
  guardrail → notify. Tenant-isolated; no shared inbox; idempotent on Message-ID.
- `server/inboundWebhook.ts` + `POST /api/sendgrid/inbound` — SendGrid Inbound
  Parse endpoint (multipart, via busboy).
- `inbound_messages` table (migration `0001_lead_reply_agent.sql`).
- `emailService.sendEmail({ userId, leadId })` now sets a signed `Reply-To`.

## How a reply flows

```
Lead replies to a campaign email
  → SendGrid Inbound Parse (MX on REPLY_DOMAIN)
  → POST /api/sendgrid/inbound  (multipart: from, to, subject, text, html, headers)
  → parseReplyAddress(to)  → verify HMAC → (userId, leadId)   [forged tags dropped]
  → classifyReply(stripQuotedReply(text))
  → store in inbound_messages (owned by userId)
  → guardrail: unsubscribe/spam/not_interested/bounce → stop the lead, status="ignored"
                positive/neutral → status="received" (awaits assisted draft in phase 3)
  → notify the owner
```

## One-time production setup (manual — needs DNS + SendGrid dashboard)

1. **Pick the reply domain** and set `REPLY_DOMAIN` (default `reply.nexifyhub.no`).
2. **DNS**: add an `MX` record for that host pointing to SendGrid:
   `reply.nexifyhub.no.  MX  10  mx.sendgrid.net.`
3. **SendGrid → Settings → Inbound Parse → Add Host & URL**:
   - Receiving domain: `reply.nexifyhub.no`
   - Destination URL: `https://lead.nexifyhub.no/api/sendgrid/inbound`
     (append `?token=...` if you set `INBOUND_PARSE_TOKEN`).
   - Leave "POST the raw, full MIME message" **unchecked** (we parse fields).
4. **Railway env**: set `REPLY_DOMAIN` (and optionally `INBOUND_PARSE_TOKEN`).
   Migrations run automatically on deploy, creating `inbound_messages`.

### Verify
Send a campaign email (the agent path) so the recipient gets a `Reply-To` of
`reply+{userId}-{leadId}-{token}@reply.nexifyhub.no`, reply to it, and check that
a row appears in `inbound_messages` and the owner gets a notification.

## Security notes

- Inbound Parse has no signature; authenticity rests on the **signed tag** — a
  spoofed POST cannot forge a valid `(userId, leadId)` without `APP_SECRET`, so it
  matches no tenant and is dropped (nothing stored, no cross-tenant leak).
- `INBOUND_PARSE_TOKEN` adds a shared-secret gate on the URL for defence in depth.
- Replies that cannot be matched to a tenant are **not stored** (no orphan inbox).
- The endpoint always returns 200 so SendGrid does not retry unparseable payloads.

## Not yet built (next phases)

- Phase 2: inbox UI (list replies, threads, classification, lead status).
- Phase 3: assisted draft generation (Norwegian, per category) + approve/edit/send.
- Phase 4: opt-in full-auto send with the full guardrail (rate limits, consent).
