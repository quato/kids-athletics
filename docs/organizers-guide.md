# Organizers Guide

## Adding a New Event

Events are stored in the `events` table in Neon. Open the Neon SQL editor (https://console.neon.tech) and run:

```sql
INSERT INTO events (name, date, fee_amount, registration_deadline)
VALUES (
  'Kids Athletics FEST — травень 2026',           -- display name shown in registration form
  '2026-05-17 09:00:00+03',                       -- event date/time (Kyiv timezone = UTC+3)
  350.00,                                          -- registration fee in UAH
  '2026-05-15 23:59:00+03'                         -- registration closes at this time
);
```

After inserting, the event immediately appears in the `/registration` form dropdown (the API filters by `registration_deadline > now()`).

To update the fee after an event is created (affects only new registrations, not existing ones):

```sql
UPDATE events SET fee_amount = 400.00 WHERE id = 1;
```

To close registration early:

```sql
UPDATE events SET registration_deadline = now() WHERE id = 1;
```

## Registration Statuses

| Status | Meaning |
|--------|---------|
| `pending` | Form submitted, payment not yet received |
| `paid` | Payment matched via Monobank webhook or manual sync |

### How to Check Registrations

All pending:
```sql
SELECT id, child_name, payment_code, expected_amount, created_at
FROM registrations
WHERE status = 'pending'
ORDER BY created_at DESC;
```

All paid for a specific event:
```sql
SELECT r.id, r.child_name, r.payment_code, r.paid_at
FROM registrations r
WHERE r.event_id = 1 AND r.status = 'paid'
ORDER BY r.paid_at DESC;
```

Count by status:
```sql
SELECT event_id, status, count(*) FROM registrations GROUP BY event_id, status ORDER BY event_id;
```

## Payment Instructions Template for Parents

Use this text in social media posts, PDF info sheets, or automated email:

---

**Як оплатити участь у Kids Athletics FEST:**

1. Зареєструйтесь на сайті [kids-athletics.com.ua/registration](https://kids-athletics.com.ua/registration).
2. Після заповнення форми ви отримаєте **індивідуальний код платежу** (формат: `EV2026-XXXXXX`) та суму до сплати.
3. Виконайте переказ будь-яким способом:
   - Monobank / Privatbank / ПУМБ або інший банк
   - На картку організатора (реквізити надсилаються на email)
4. **ОБОВ'ЯЗКОВО** вкажіть код платежу у призначенні/коментарі до переказу.
5. Статус оплати автоматично оновиться на сайті протягом кількох хвилин.

Якщо статус не оновився протягом 24 годин — напишіть організатору.

---

> The `paymentCode` in the message is matched automatically by the webhook against the `description` field of the Monobank statement. It is case-insensitive and searches for the code anywhere in the description text.

## Unmatched Payments

If a payment arrived but status is still `pending`:

1. Check `mono_events` for the raw statement:
   ```sql
   SELECT id, received_at, payload FROM mono_events
   WHERE processed = false
   ORDER BY received_at DESC;
   ```

2. Manually match a payment to a registration (use actual values):
   ```sql
   UPDATE registrations
   SET status = 'paid',
       paid_at = now(),
       mono_transaction_id = '<statementItem.id from mono_events>',
       raw_statement = '<payload from mono_events>'::jsonb
   WHERE id = <registration_id>;
   ```

3. Mark the mono_event as processed:
   ```sql
   UPDATE mono_events SET processed = true, processed_at = now() WHERE id = <mono_event_id>;
   ```

## Manual Sync

If the webhook missed payments (e.g., webhook was offline), trigger a manual sync by calling:

```
GET https://kids-athletics.com.ua/api/mono-sync
```

This fetches the last 24 hours of transactions from Monobank and reruns the matching algorithm. Safe to call multiple times — duplicate guard prevents double-matching.
