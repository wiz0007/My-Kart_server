# Render Environment Variables

Set these in Render under **Service > Environment**. Do not commit real values.

```env
NODE_ENV=production
PORT=5000

MONGO_URL=mongodb+srv://<user>:<password>@<cluster>/<database>
JWT_SECRET=<generate-a-random-secret-at-least-32-chars>
JWT_EXPIRES_IN=15m

AUTH_COOKIE_NAME=mykart_access
ACCESS_COOKIE_MAX_AGE_MS=900000
REFRESH_COOKIE_NAME=mykart_refresh
REFRESH_COOKIE_MAX_AGE_MS=2592000000
REFRESH_TOKEN_TTL_DAYS=30
COOKIE_SAME_SITE=none
COOKIE_SECURE=true
CSRF_COOKIE_NAME=mykart_csrf
CSRF_HEADER_NAME=X-CSRF-Token

FRONTEND_URL=https://my-kart-taupe.vercel.app
CLIENT_URL=https://my-kart-taupe.vercel.app
CORS_ORIGINS=https://my-kart-taupe.vercel.app

RATE_LIMIT_MAX=300
AUTH_RATE_LIMIT_MAX=20
LOGIN_FAILURE_LIMIT=5
ACCOUNT_LOCK_MINUTES=15
EMAIL_VERIFICATION_TTL_HOURS=24
PASSWORD_RESET_TTL_MINUTES=15

# Optional. If omitted, product admin mutations stay disabled.
ADMIN_API_KEY=<generate-a-random-secret-at-least-32-chars>

EMAIL_USER=<gmail-address>
EMAIL_PASS=<gmail-app-password>

GOOGLE_CLIENT_ID=<google-oauth-client-id>
GOOGLE_CLIENT_SECRET=<google-oauth-client-secret>
GOOGLE_CALLBACK_URL=https://<your-render-service>.onrender.com/api/auth/google/callback
```

For production, do not set any origin to `localhost` or `127.0.0.1`.
