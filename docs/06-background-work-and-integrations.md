# Background work and integrations

Cartura uses provider adapters and background workers for operations that should not be coupled to an HTTP response. The domain service decides what should happen. Infrastructure code decides how to talk to an external system.

## Redis and BullMQ

The local Redis service is defined in `compose.redis.yml`. When background workers are enabled, the backend uses Redis and BullMQ to schedule repeated processing for:

- outbox delivery;
- notification delivery;
- stale order processing;
- pending media cleanup.

Worker startup is coordinated in `backend/src/infrastructure/workers/background-workers.ts`. Disable workers only when the environment intentionally runs them in another process or does not need asynchronous delivery.

## Transactional outbox

Business changes that require a notification write an outbox event in the same PostgreSQL transaction as the domain change.

```text
domain transaction
  -> update business records
  -> write audit record
  -> write outbox event
  -> commit

background worker
  -> claim outbox event
  -> create notification delivery
  -> mark event completed or retryable
```

This avoids sending a notification for a database change that later rolls back. Claims and claim tokens prevent two workers from treating the same event as their own completed work.

## Paymob payments and refunds

Paymob network calls live under `backend/src/infrastructure/payments`. Payment and refund services own lifecycle decisions; repositories own atomic persistence.

Webhook processing verifies HMAC, records the event, claims it, matches the payment, validates amount, currency, and integration, and then applies an allowed lifecycle transition. Duplicate, late, mismatched, or uncertain events are retained for processing or manual review instead of silently changing an order.

A refund request that times out after reaching Paymob remains in a processing or reconciliation state. Do not automatically retry an uncertain provider call, because the original request may already have moved money.

## Cloudinary media

Cloudinary access belongs in the storage infrastructure layer. Feature code works with media assets and attachment rules rather than Cloudinary credentials.

Uploads create pending assets. A feature later attaches the asset to a product or category. Replaced, removed, expired, or failed pending assets are cleaned up without exposing provider secrets to the browser.

Browser file uploads use a Next.js Route Handler because multipart upload is a genuine browser HTTP boundary.

## Email and notifications

SMTP configuration belongs to the mail infrastructure layer. Auth emails are requested by Better Auth flows. Domain notifications are produced through outbox events and delivered asynchronously.

Do not send transactional email directly from a controller or inside a database transaction.

## Adding an integration

1. Define the domain use case without provider-specific response shapes.
2. Add a narrow infrastructure adapter for the provider.
3. Inject the adapter into the service when tests need substitution.
4. Validate provider responses at the infrastructure boundary.
5. Persist domain state through a repository transaction.
6. Add idempotency, claim, retry, and manual-review behavior appropriate to the operation.
7. Keep credentials in backend environment variables only.
8. Test success, explicit failure, timeout, duplicate delivery, and local-write failure after provider success.

Next: [Testing and quality](07-testing-and-quality.md).

