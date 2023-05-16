import { Hono } from "hono";
import type { Env } from "./types";
import { handlePubsubRequest } from "./pubsub/requestHandler";
import { handleGoogleOAuthCallback } from "./oauth/handleGoogleCallback";
import { HTTPException } from "hono/http-exception";
import type { StatusCode } from "hono/utils/http-status";
import { generateGoogleOAuthUrl } from "./utils";

export const app = new Hono<{ Bindings: Env }>();

// When a user first signs up, call https://developers.google.com/gmail/api/reference/rest/v1/users/watch
//  to enable the pubsub subscription and get the last history id. Store it in KV.

// A "Test Webhook" button could be powered by https://developers.google.com/gmail/api/reference/rest/v1/users.messages/list
//  with maxResults set to 1.

app.get("/", async c => {
    return c.text("Hello sweetie");
});

app.get("/callback/google", async c => {
    return await handleGoogleOAuthCallback(c);
});

app.get("/login/google", async c => {
    const loginUrl = generateGoogleOAuthUrl(c.env);
    return c.redirect(loginUrl, 302);
});

app.post("/pubsub", async c => {
    return await handlePubsubRequest(c);
});

app.onError((err, c) => {
    let status: StatusCode = 500;
    let message: string = "Internal Server Error";
    if (err instanceof HTTPException) {
        status = err.status;
        message = err.message;
    } else {
        console.error(c.req.url, err);
    }
    return c.json({
        error: message,
        status,
    });
});
