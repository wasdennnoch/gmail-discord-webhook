# Gmail Discord Notifications Cloudflare Worker

Heavily WIP.

Inspired by https://github.com/jzvi12/gmail-push-to-discord, but for Cloudflare Workers and without the need for everyone to self-host it.

## TODOs

- https://cloud.google.com/pubsub/docs/push?authuser=1#validate_tokens
- https://developers.google.com/gmail/api/guides/push
- Sentry for Workers: https://github.com/robertcepa/toucan-js
- Use Discord OAuth for generating webhooks so users don't have to

## Restricted Scope Verification

- https://www.tarams.com/google-oauth-review-process-for-restricted-scopes/
- https://groups.google.com/g/google-apps-script-community/c/ruRamtj_C0w

## Notes

- Refresh tokens may stop working after they are granted, either because:
    - The refresh token has not been used for 6 months
    - The user changed passwords and the refresh token contains Gmail scopes
    - The application has a status of 'Testing' and the consent screen is configured for an external user type, causing the token to expire in 7 days
    - Source: README of https://github.com/googleapis/google-api-nodejs-client
