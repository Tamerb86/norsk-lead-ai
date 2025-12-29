# NorskLeads API Reference

This document provides a comprehensive reference for the NorskLeads tRPC API endpoints.

## Authentication

All API endpoints (except public ones) require authentication. The API uses session-based authentication with cookies.

### `auth.me`
**Type:** Query (Public)

Returns the currently authenticated user or `null` if not authenticated.

**Response:**
```typescript
{
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  role: string;
  credits: number;
  // ... other user fields
} | null
```

### `auth.logout`
**Type:** Mutation (Public)

Logs out the current user by clearing the session cookie.

**Response:**
```typescript
{ success: true }
```

---

## Companies

### `companies.search`
**Type:** Query (Protected)

Search for Norwegian companies with various filters.

**Input:**
| Field | Type | Description |
|-------|------|-------------|
| `query` | string? | Search query for company name |
| `fylke` | string? | Filter by county (fylke) |
| `kommune` | string? | Filter by municipality |
| `poststed` | string? | Filter by postal area |
| `naeringskode` | string? | Filter by industry code |
| `organisasjonsform` | string? | Filter by organization type |
| `foundedAfter` | string? | Companies founded after date |
| `foundedBefore` | string? | Companies founded before date |
| `minEmployees` | number? | Minimum number of employees |
| `maxEmployees` | number? | Maximum number of employees |
| `hasEmail` | boolean? | Filter companies with email |
| `hasPhone` | boolean? | Filter companies with phone |
| `hasWebsite` | boolean? | Filter companies with website |
| `sortBy` | enum? | Sort by: 'name', 'employees', 'founded', 'recent' |
| `sortOrder` | enum? | Sort order: 'asc', 'desc' |
| `limit` | number? | Number of results to return |
| `offset` | number? | Offset for pagination |

**Response:**
```typescript
{
  companies: Company[];
  total: number;
  hasMore: boolean;
}
```

### `companies.getById`
**Type:** Query (Protected)

Get a company by its ID.

**Input:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | number | Company ID |

### `companies.stats`
**Type:** Query (Protected)

Get statistics about companies in the database.

---

## Campaigns

### `campaigns.list`
**Type:** Query (Protected)

Get all campaigns for the current user.

### `campaigns.getById`
**Type:** Query (Protected)

Get a specific campaign by ID.

**Input:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | number | Campaign ID |

### `campaigns.create`
**Type:** Mutation (Protected)

Create a new campaign.

**Input:**
| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Campaign name |
| `emailSubject` | string? | Email subject line |
| `emailBody` | string? | Email body content |
| `senderName` | string? | Sender display name |
| `senderEmail` | string? | Sender email address |
| `replyTo` | string? | Reply-to email address |

### `campaigns.update`
**Type:** Mutation (Protected)

Update an existing campaign.

**Input:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | number | Campaign ID |
| `name` | string? | Campaign name |
| `status` | string? | Campaign status |
| `emailSubject` | string? | Email subject line |
| `emailBody` | string? | Email body content |
| `senderName` | string? | Sender display name |
| `senderEmail` | string? | Sender email address |
| `replyTo` | string? | Reply-to email address |

### `campaigns.delete`
**Type:** Mutation (Protected)

Delete a campaign.

**Input:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | number | Campaign ID |

### `campaigns.send`
**Type:** Mutation (Protected)

Queue campaign emails for sending.

**Input:**
| Field | Type | Description |
|-------|------|-------------|
| `campaignId` | number | Campaign ID |
| `leadIds` | number[] | Array of lead IDs to send to |
| `scheduledAt` | Date? | Optional scheduled send time |

### `campaigns.getAnalytics`
**Type:** Query (Protected)

Get analytics for a specific campaign.

**Input:**
| Field | Type | Description |
|-------|------|-------------|
| `campaignId` | number | Campaign ID |

---

## Leads

### `leads.list`
**Type:** Query (Protected)

Get leads for a specific campaign.

**Input:**
| Field | Type | Description |
|-------|------|-------------|
| `campaignId` | number | Campaign ID |

### `leads.addToCampaign`
**Type:** Mutation (Protected)

Add a company as a lead to a campaign.

**Input:**
| Field | Type | Description |
|-------|------|-------------|
| `campaignId` | number | Campaign ID |
| `companyId` | number | Company ID to add |

### `leads.updateStatus`
**Type:** Mutation (Protected)

Update the status of a lead.

**Input:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | number | Lead ID |
| `status` | string | New status |

### `leads.validateEmail`
**Type:** Mutation (Protected)

Validate an email address.

**Input:**
| Field | Type | Description |
|-------|------|-------------|
| `email` | string | Email to validate |

### `leads.validatePhone`
**Type:** Mutation (Protected)

Validate a phone number.

**Input:**
| Field | Type | Description |
|-------|------|-------------|
| `phone` | string | Phone number to validate |

### `leads.checkWebsite`
**Type:** Mutation (Protected)

Check if a website is accessible.

**Input:**
| Field | Type | Description |
|-------|------|-------------|
| `url` | string | Website URL to check |

---

## Templates

### `templates.list`
**Type:** Query (Protected)

Get all email templates for the current user.

### `templates.create`
**Type:** Mutation (Protected)

Create a new email template.

**Input:**
| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Template name |
| `subject` | string | Email subject |
| `body` | string | Email body |
| `category` | string? | Template category |

### `templates.update`
**Type:** Mutation (Protected)

Update an existing template.

**Input:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | number | Template ID |
| `name` | string? | Template name |
| `subject` | string? | Email subject |
| `body` | string? | Email body |
| `category` | string? | Template category |

### `templates.delete`
**Type:** Mutation (Protected)

Delete a template.

**Input:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | number | Template ID |

---

## A/B Testing

### `abTesting.list`
**Type:** Query (Protected)

Get all A/B tests for the current user.

### `abTesting.getById`
**Type:** Query (Protected)

Get a specific A/B test by ID.

**Input:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | number | A/B Test ID |

### `abTesting.create`
**Type:** Mutation (Protected)

Create a new A/B test.

**Input:**
| Field | Type | Description |
|-------|------|-------------|
| `campaignId` | number | Campaign ID |
| `name` | string | Test name |
| `testType` | enum | Type: 'subject', 'content', 'sender', 'send_time' |
| `variantA` | object | Variant A configuration |
| `variantB` | object | Variant B configuration |
| `sampleSize` | number | Sample size percentage (5-50) |
| `winningCriteria` | enum | Criteria: 'open_rate', 'click_rate', 'reply_rate' |
| `autoSelectWinner` | boolean | Auto-select winner |
| `testDurationHours` | number | Test duration in hours |

### `abTesting.selectWinner`
**Type:** Mutation (Protected)

Manually select a winner for an A/B test.

**Input:**
| Field | Type | Description |
|-------|------|-------------|
| `testId` | number | A/B Test ID |
| `winner` | enum | Winner: 'A' or 'B' |

---

## Lead Scoring

### `leadScoringAdvanced.getLeadsByTier`
**Type:** Query (Protected)

Get leads grouped by scoring tier.

**Input:**
| Field | Type | Description |
|-------|------|-------------|
| `tier` | enum? | Filter by tier: 'cold', 'warm', 'hot', 'very_hot' |

### `leadScoringAdvanced.getRules`
**Type:** Query (Protected)

Get all scoring rules for the current user.

### `leadScoringAdvanced.createRule`
**Type:** Mutation (Protected)

Create a new scoring rule.

**Input:**
| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Rule name |
| `ruleType` | enum | Type: 'engagement', 'company_attribute', 'behavior' |
| `condition` | object | Rule condition |
| `scoreChange` | number | Points to add/subtract |
| `isActive` | boolean | Whether rule is active |

### `leadScoringAdvanced.updateRule`
**Type:** Mutation (Protected)

Update an existing scoring rule.

### `leadScoringAdvanced.deleteRule`
**Type:** Mutation (Protected)

Delete a scoring rule.

### `leadScoringAdvanced.recalculateScores`
**Type:** Mutation (Protected)

Recalculate scores for all leads.

---

## Webhooks

### `webhooks.list`
**Type:** Query (Protected)

Get all webhooks for the current user.

### `webhooks.create`
**Type:** Mutation (Protected)

Create a new webhook.

**Input:**
| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Webhook name |
| `url` | string | Endpoint URL |
| `secret` | string? | Signing secret |
| `events` | string[] | Events to subscribe to |

**Available Events:**
- `lead.created`, `lead.updated`, `lead.deleted`
- `campaign.created`, `campaign.sent`, `campaign.completed`
- `email.opened`, `email.clicked`, `email.replied`, `email.bounced`
- `subscription.created`, `subscription.cancelled`

### `webhooks.update`
**Type:** Mutation (Protected)

Update a webhook.

**Input:**
| Field | Type | Description |
|-------|------|-------------|
| `webhookId` | number | Webhook ID |
| `isActive` | boolean? | Enable/disable webhook |

### `webhooks.delete`
**Type:** Mutation (Protected)

Delete a webhook.

**Input:**
| Field | Type | Description |
|-------|------|-------------|
| `webhookId` | number | Webhook ID |

### `webhooks.test`
**Type:** Mutation (Protected)

Send a test webhook.

**Input:**
| Field | Type | Description |
|-------|------|-------------|
| `webhookId` | number | Webhook ID |

### `webhooks.getDeliveries`
**Type:** Query (Protected)

Get delivery history for a webhook.

**Input:**
| Field | Type | Description |
|-------|------|-------------|
| `webhookId` | number | Webhook ID |
| `limit` | number? | Number of deliveries to return |

---

## Referrals

### `referral.getMyStats`
**Type:** Query (Protected)

Get referral statistics for the current user.

### `referral.getMyReferrals`
**Type:** Query (Protected)

Get list of referrals made by the current user.

### `referral.sendInvite`
**Type:** Mutation (Protected)

Send a referral invitation email.

**Input:**
| Field | Type | Description |
|-------|------|-------------|
| `email` | string | Email address to invite |
| `name` | string? | Name of the person |

### `referral.claimReward`
**Type:** Mutation (Protected)

Claim a referral reward.

**Input:**
| Field | Type | Description |
|-------|------|-------------|
| `referralId` | number | Referral ID |

### `referral.validateCode`
**Type:** Query (Public)

Validate a referral code.

**Input:**
| Field | Type | Description |
|-------|------|-------------|
| `code` | string | Referral code to validate |

---

## Dashboard

### `dashboard.stats`
**Type:** Query (Protected)

Get dashboard statistics.

### `dashboard.recentCampaigns`
**Type:** Query (Protected)

Get recent campaigns with stats.

### `dashboard.topLeads`
**Type:** Query (Protected)

Get top performing leads.

---

## Rate Limits

The API implements rate limiting to ensure fair usage:

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| General API | 2000 requests | 15 minutes |
| Authentication | 50 requests | 15 minutes |
| Registration | 5 requests | 1 hour |
| Password Reset | 3 requests | 15 minutes |
| Search | 30 requests | 1 minute |
| AI Operations | 20 requests | 1 minute |
| Export | 10 requests | 5 minutes |
| Webhooks | 100 requests | 1 minute |

---

## Error Handling

All errors follow this format:

```typescript
{
  error: {
    message: string;
    code: string;
  }
}
```

Common error codes:
- `UNAUTHORIZED` - Not authenticated
- `FORBIDDEN` - Not authorized
- `NOT_FOUND` - Resource not found
- `BAD_REQUEST` - Invalid input
- `TOO_MANY_REQUESTS` - Rate limit exceeded
- `INTERNAL_SERVER_ERROR` - Server error

---

## Webhook Signatures

Webhook requests are signed using HMAC-SHA256. To verify:

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

Headers included:
- `X-Webhook-Signature`: HMAC-SHA256 signature
- `X-Webhook-Timestamp`: Unix timestamp
- `X-Webhook-Event`: Event type

---

*Last updated: December 2024*
