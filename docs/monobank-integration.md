# Monobank Integration

## Architecture Overview

```
Browser           Vercel Functions            Neon Postgres
  |                     |                          |
  |-- POST /api/registration -->                   |
  |               INSERT registrations (pending)   |
  |<---- { id, paymentCode, amount } --------------|
  |                     |                          |
  |-- GET /api/registration-status?id=... -->      |
  |<---- { status: 'pending' | 'paid', ... } ------|
  |                     |                          |
                        |                          |
Monobank              (webhook / sync)             |
  |-- POST /api/monobank-webhook -->               |
  |               INSERT mono_events               |
  |               matchAndPay()                    |
  |               UPDATE registrations (paid) ---->|
  |<---- { status: 'ok' } ----------------------- |
```

## StatementItem Format

Monobank sends a webhook POST with this shape when money arrives:

```json
{
  "type": "StatementItem",
  "data": {
    "account": "string (account id)",
    "statementItem": {
      "id":              "string – unique transaction id",
      "time":            1234567890,
      "description":     "string – payer message",
      "mcc":             4829,
      "originalMcc":     4829,
      "hold":            false,
      "amount":          35000,
      "operationAmount": 35000,
      "currencyCode":    980,
      "commissionRate":  0,
      "cashbackAmount":  0,
      "balance":         100500
    }
  }
}
```

Key fields used for matching:
- `id` – globally unique; used as duplicate guard (`mono_transaction_id`).
- `amount` – in kopecks (÷100 = UAH); used for fallback matching.
- `description` – free-text; used for primary matching against `payment_code`.

## Payment Code Format

`EV<4-digit-year>-<6-digit-zero-padded-id>`

Example: `EV2026-000042`

Parents must include this exact code in the payment description/comment. The webhook matches it case-insensitively against the `description` field.

## Matching Algorithm (`api/lib/registration-matching.ts`)

1. **Duplicate guard** – look up `registrations.mono_transaction_id = statementItem.id`. If found → `duplicate`.
2. **Primary match** – find `registrations WHERE status='pending' AND description ILIKE '%' || payment_code || '%'`. Most reliable; requires parent to copy the code correctly.
3. **Fallback match** – find `registrations WHERE status='pending' AND expected_amount = amount/100 AND created_at >= now() - 7 days`. Catches cases where the parent forgot the code but paid the right amount within the window.
4. If matched → `UPDATE registrations SET status='paid', paid_at, mono_transaction_id, raw_statement`.

Return values: `ok`, `not_matched`, `duplicate`.

## Endpoints

### `GET /api/events`
Returns upcoming events (registration deadline in the future).

**Response:**
```json
{
  "events": [
    {
      "id": 1,
      "name": "Kids Athletics FEST — травень 2026",
      "date": "2026-05-17T09:00:00.000Z",
      "feeAmount": 350,
      "registrationDeadline": "2026-05-15T23:59:00.000Z"
    }
  ]
}
```

### `POST /api/registration`
Create a new registration.

**Body:**
```json
{
  "eventId": 1,
  "childName": "Іваненко Михайло",
  "parentName": "Іваненко Олена",
  "phone": "+380501234567",
  "email": "ivanenko@example.com"
}
```

**Response (201):**
```json
{
  "id": 42,
  "paymentCode": "EV2026-000042",
  "amount": 350
}
```

### `GET /api/monobank-webhook`
Returns `200 OK` — used by Monobank to verify the webhook URL.

### `POST /api/monobank-webhook`
Receives incoming payment notifications. Handles `StatementItem` events and runs the matching algorithm. All raw events are stored in `mono_events`.

**Response:** `{ "status": "ok" | "ignored" | "not_matched" | "duplicate" }`

### `GET /api/registration-status?id=<number>`
Poll payment status for a specific registration.

**Response:**
```json
{
  "id": 42,
  "status": "paid",
  "paidAt": "2026-05-10T14:30:00.000Z",
  "childName": "Іваненко Михайло",
  "eventId": 1,
  "paymentCode": "EV2026-000042",
  "expectedAmount": 350
}
```

### `GET /api/mono-sync`
Manually pull last 24h transactions from Monobank API and run matching for each.

Requires `MONO_TOKEN` env var. Optional `MONO_ACCOUNT_ID` (defaults to `"0"` = first account).

**Response:**
```json
{
  "windowHours": 24,
  "from": "2026-05-09T14:00:00.000Z",
  "to":   "2026-05-10T14:00:00.000Z",
  "stats": {
    "reviewed": 12,
    "matched": 3,
    "duplicates": 1,
    "not_matched": 8,
    "errors": 0
  }
}
```

## Webhook Registration with Monobank

In Monobank API console:
1. Go to https://api.monobank.ua/ and create a token.
2. Register webhook: `POST https://api.monobank.ua/personal/webhook` with body `{ "webHookUrl": "https://your-domain.com/api/monobank-webhook" }` and header `X-Token: <your token>`.
3. Monobank immediately sends a GET to verify. If it returns 200, the webhook is active.
