import { Context } from "hono";
import type { Env, GoogleIdTokenPayload, GoogleOAuthTokenExchangeResult, KvUserSettings } from "../types";
import { HTTPException } from "hono/http-exception";
import { decodeJwtPayloadWithoutVerification } from "../utils";
import { getGmailProfile } from "../gmail";
import { GOOGLE_OAUTH2_TOKEN_URL } from "../constants";

export async function handleGoogleOAuthCallback(c: Context<{ Bindings: Env }>): Promise<Response> {

    const error = c.req.query("error");
    if (error) {
        return c.json({
            error,
        }, 400);
    }

    // TODO Validate state, somehow. And maybe use PKCE?
    // const state = c.req.query("state");
    const code = c.req.query("code");
    if (!code) {
        throw new HTTPException(400, {
            message: "Missing 'code' parameter",
        });
    }

    const tokens = await doGoogleOAuthTokenExchange(code, c.env);
    const accessTokenExpiresAt = Date.now() + (tokens.expires_in * 1000);

    // No need to validate this as we obtained it through the trusted backchannel communication with Google
    const jwt = decodeJwtPayloadWithoutVerification<GoogleIdTokenPayload>(tokens.id_token);
    if (!jwt.email || !jwt.email_verified || !jwt.name) {
        throw new HTTPException(400, {
            message: "Missing OpenID token values! Did you tamper with the authorization URL?",
        });
    }

    const gmailProfile = await getGmailProfile();
    if (gmailProfile.emailAddress !== jwt.email) {
        throw new Error(`Email Mismatch: jwt=${jwt.email}; gmailProfile=${gmailProfile.emailAddress}`);
    }

    const userSettings = {
        email: jwt.email,
        name: jwt.given_name ?? jwt.name,
        avatar: jwt.picture ?? null,
        googleTokens: {
            refreshToken: tokens.refresh_token,
            accessToken: tokens.access_token,
            expiresAt: accessTokenExpiresAt,
            scopes: tokens.scope.split("."),
        },
        lastHistoryId: gmailProfile.historyId,

    } satisfies KvUserSettings;
    await c.env.KV_USER_SETTINGS.put(jwt.email, JSON.stringify(userSettings));

    return c.json({
        email: userSettings.email,
        name: userSettings.name,
        avatar: userSettings.avatar,
    });

}

async function doGoogleOAuthTokenExchange(code: string, env: Env): Promise<Required<GoogleOAuthTokenExchangeResult>> {
    const res = await fetch(GOOGLE_OAUTH2_TOKEN_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            code,
            client_id: env.GOOGLE_CLIENT_ID,
            client_secret: env.GOOGLE_CLIENT_SECRET,
            redirect_uri: env.GOOGLE_OAUTH_REDIRECT_URL,
            grant_type: "authorization_code",
        }).toString(),
        // Technicaly it's Partial but then TS complains further down
    });
    if (!res.ok) {
        throw new HTTPException(400, {
            message: "Invalid `code` parameter",
        });
    }
    
    const tokens = await res.json<Required<GoogleOAuthTokenExchangeResult>>();

    if (
        !tokens.refresh_token ||
        !tokens.access_token ||
        !tokens.expires_in ||
        !tokens.id_token ||
        !tokens.scope ||
        !tokens.token_type
    ) {
        throw new HTTPException(400, {
            message: "Missing OAuth tokens! Did you tamper with the authorization URL?",
        });
    }

    return tokens;
}
