# Existing developer API integration

This document records the API access implementation that already exists in `digi2tech2-dev/Winnie-Backend` and is deployed at `https://winnie-backend.onrender.com`.

## Account fields

- `isApiEnabled`: enables or disables Client API access for the user.
- `apiToken`: a 32-byte random token stored by the backend with `select: false`.

The normal profile and admin responses expose `isApiEnabled` but intentionally omit `apiToken`.

## Admin activation

### `PATCH /api/admin/users/:id`

Requires an authenticated admin.

```json
{
  "isApiEnabled": true
}
```

When enabling access for the first time, the backend creates an API token automatically. Disabling changes `isApiEnabled` to `false`; the existing token is rejected by the Client API middleware while access is disabled.

## Customer token management

### `GET /api/users/me`

Requires the website JWT and returns the current user, including `isApiEnabled`. It does not reveal the stored API token.

### `PATCH /api/users/me/api-token`

Requires the website JWT and replaces the current API token. The new secret is returned in this response:

```json
{
  "success": true,
  "message": "API token regenerated successfully.",
  "data": {
    "apiToken": "FULL_NEW_TOKEN",
    "user": {
      "isApiEnabled": true
    }
  }
}
```

Because profile reads intentionally hide `apiToken`, the frontend displays the full token immediately after this endpoint succeeds. After a page reload, the user must generate a new token to reveal a copyable secret again.

## Client API

Base URL:

```text
https://winnie-backend.onrender.com/api/client
```

Every request must send the token in this header:

```http
api-token: YOUR_API_TOKEN
```

The deployed Client API exposes:

- `GET /profile` — balance, currency, and account email.
- `GET /products` — available API products, prices, quantity limits, and required params.
- `POST /orders` — create an order.
- `GET /check?orders=ORDER_ID,ORDER_UUID` — check one or more orders.

Order creation body:

```json
{
  "productId": "PRODUCT_ID",
  "qty": 1,
  "order_uuid": "UNIQUE_CLIENT_REFERENCE",
  "dynamicData": {
    "player_id": "123456789",
    "server": "EU"
  }
}
```

`order_uuid` is the idempotency key: reusing the same value returns the existing order instead of creating a duplicate.
