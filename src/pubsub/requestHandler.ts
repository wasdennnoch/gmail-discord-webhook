import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { GOOGLE_PUBSUB_JWT_PUBLC_KEY_ENDPOINT, PUBSUB_JWT_AUDIENCE, PUBSUB_JWT_ISSUERS } from "../constants";
import type { Env, KvUserSettings, PubsubGmailMessagePayload, PubsubMessage } from "../types";
import { listMessageHistory } from "../gmail";
import { parseAndValidateJwt } from "../utils";

export async function handlePubsubRequest(c: Context<{ Bindings: Env }>): Promise<Response> {

    await validateRequest(c);

    const payload = await parseRequestBody(c);

    const userSettings = await c.env.KV_USER_SETTINGS.get<KvUserSettings>(payload.emailAddress, { type: "json" });
    if (!userSettings) {
        throw new HTTPException(403, {
            message: `User ${payload.emailAddress} does not have a config`,
        });
    }

    // TODO "If the startHistoryId supplied by your client is outside the available range of history records,
    // the API returns an HTTP 404 error response. In this case, your client must perform a full sync."
    const newHistory = await listMessageHistory(userSettings.lastHistoryId);

    return new Response(null, {
        status: 204,
    });

}

async function validateRequest(c: Context) {
    const authHeader = c.req.header("Authorization");
    const jwt = authHeader?.match(/Bearer (.+)/)?.[1];
    if (!jwt) {
        throw new HTTPException(401, {
            message: "Unauthorized",
        });
    }

    const { payload } = await parseAndValidateJwt(jwt, GOOGLE_PUBSUB_JWT_PUBLC_KEY_ENDPOINT, {
        audience: PUBSUB_JWT_AUDIENCE,
        issuer: PUBSUB_JWT_ISSUERS,
    });

    if (payload.email !== c.env.PUBSUB_JWT_EMAIL || !payload.email_verified) {
        throw new HTTPException(401, {
            message: "Invalid JWT Email",
        });
    }
}

async function parseRequestBody(c: Context): Promise<PubsubGmailMessagePayload> {
    const body = await c.req.json() as PubsubMessage;
    const pubsubMessage = body.message;
    const pubsubPayload = pubsubMessage.data;
    const messageData = JSON.parse(atob(pubsubPayload)) as PubsubGmailMessagePayload;
    return messageData;
}
