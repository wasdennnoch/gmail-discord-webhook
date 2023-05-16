export const PUBSUB_JWT_AUDIENCE: string[] = ["worker-pubsub"];
export const PUBSUB_JWT_ISSUERS: string[] = ["https://accounts.google.com", "accounts.google.com"];

// TODO Would be nice for users to have a choice to only request the gmail.metadata scope,
//      which (to my knowledge) still allows notifications about new messages, but hides their content,
//      so users would just get a "You have new Mail!" message without excerpts.
//      Nonetheless, both scopes are restricted and need verification.
export const GOOGLE_OAUTH_SCOPES: string[] = [
    "openid",
    "profile",
    "email",
    "https://www.googleapis.com/auth/gmail.readonly",
];
export const GOOGLE_OAUTH2_CONSENT_URL = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_OAUTH2_TOKEN_URL = "https://oauth2.googleapis.com/token";

export const GOOGLE_PUBSUB_JWT_PUBLC_KEY_ENDPOINT = "https://www.gstatic.com/iap/verify/public_key-jwk";
export const GOOGLE_OAUTH_JWT_PUBLC_KEY_ENDPOINT = "https://www.googleapis.com/oauth2/v3/certs";

// https://developers.google.com/gmail/api/reference/rest/v1/users/getProfile
export const GMAIL_GET_PROFILE_ENDPOINT = "https://gmail.googleapis.com/gmail/v1/users/me/profile";
// https://developers.google.com/gmail/api/reference/rest/v1/users.history/list
export const GMAIL_LIST_HISTORY_ENDPOINT = "https://gmail.googleapis.com/gmail/v1/users/me/history";
// https://developers.google.com/gmail/api/reference/rest/v1/users.messages/list
export const GMAIL_LIST_MESSAGES_ENDPOINT = "https://gmail.googleapis.com/gmail/v1/users/me/messages";
// https://developers.google.com/gmail/api/reference/rest/v1/users.messages/get
export const GMAIL_GET_MESSAGE_ENDPOINT = (messageId: string) => `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`;
// https://developers.google.com/gmail/api/reference/rest/v1/users/watch
export const GMAIL_START_PUBSUB_ENDPOINT = "https://gmail.googleapis.com/gmail/v1/users/me/watch";
// https://developers.google.com/gmail/api/reference/rest/v1/users/stop
export const GMAIL_STOP_PUBSUB_ENDPOINT = "https://gmail.googleapis.com/gmail/v1/users/me/stop";
