import * as jose from "jose";
import type { JSONWebKeySet, JWTVerifyResult } from "jose";
import type { Env } from "./types";
import { GOOGLE_OAUTH2_CONSENT_URL, GOOGLE_OAUTH_SCOPES } from "./constants";
import { HTTPException } from "hono/http-exception";

export interface MakeRequestOptions {
    body?: unknown;
    params?: Record<string, unknown>;
    headers?: Record<string, string>;
}

export async function makeRequest<T>(
    method: string,
    url: string,
    options?: MakeRequestOptions,
): Promise<T> {
    const parsedUrl = new URL(url);
    const hasBody = method !== "GET" && method !== "HEAD" && !!options?.body;
    const baseHeaders = hasBody ? {
        "Content-Type": "application/json",
    } : {};
    if (options?.params) {
        for (const [k, v] of Object.entries(options.params)) {
            parsedUrl.searchParams.set(k, `${v}`);
        }
    }

    const res = await fetch(parsedUrl, {
        method,
        headers: Object.assign(baseHeaders, options?.headers),
        body: hasBody ? JSON.stringify(options.body) : undefined,
    });
    if (!res.ok) {
        throw new Error(`Unexpected status code ${res.status} ${res.statusText} fetching ${parsedUrl}`);
    }

    return res.json<T>();
}

export async function parseAndValidateJwt(
    jwt: string,
    keysUrl: string,
    verifyOptions?: jose.JWTVerifyOptions): Promise<JWTVerifyResult> {

    // Enable Cloudflare to cache the request to fetch the public keys, as they change rarely.
    // This way, we don't send a request every time this worker is invoked.
    const keysJson = await fetch(keysUrl, {
        cf: {
            cacheEverything: true,
        },
    }).then(r => r.json<JSONWebKeySet>());
    const keySet = jose.createLocalJWKSet(keysJson);

    let verifyResult: JWTVerifyResult;
    try {
        verifyResult = await jose.jwtVerify(
            jwt,
            keySet,
            verifyOptions,
        );
    } catch (e) {
        throw new HTTPException(401, {
            message: (e as Error).message,
        });
    }

    return verifyResult;
}

export function generateGoogleOAuthUrl(env: Env, state?: string): string {
    const args: Record<string, string> = {
        client_id: env.GOOGLE_CLIENT_ID,
        redirect_uri: env.GOOGLE_OAUTH_REDIRECT_URL,
        scope: GOOGLE_OAUTH_SCOPES.join(" "),
        response_type: "code",
        access_type: "offline",
        prompt: "select_account",
    };
    if (state) {
        args.state = state;
    }
    const params = new URLSearchParams(args);
    return `${GOOGLE_OAUTH2_CONSENT_URL}?${params.toString()}`;
}

export function decodeJwtPayloadWithoutVerification<T = unknown>(jwt: string): T {
    const [, payload] = jwt.split(".");
    return JSON.parse(atob(payload));
}
