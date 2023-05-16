import { GMAIL_GET_PROFILE_ENDPOINT, GMAIL_LIST_HISTORY_ENDPOINT } from "./constants";
import { KvUserGoogleTokens } from "./types";
import { MakeRequestOptions, makeRequest } from "./utils";

// TODO Implement this
export default class GoogleApi {

    private static readonly tokenExpiryOffset: number = 1000 * 60 * 5; // Refresh 5 minutes before expiry

    private readonly email: string;
    private readonly tokens: KvUserGoogleTokens;

    constructor(email: string, tokens: KvUserGoogleTokens) {
        this.email = email;
        this.tokens = tokens;
    }

    // https://developers.google.com/gmail/api/reference/rest/v1/users/getProfile
    public async getGmailProfile(): Promise<GmailGetProfileResult> {
        return this.makeAuthenticatedRequest("GET", GMAIL_GET_PROFILE_ENDPOINT);
    }
    
    // https://developers.google.com/gmail/api/reference/rest/v1/users.history/list
    public async listMessageHistory(startHistoryId: string): Promise<GmailListHistoryResult> {
        return this.makeAuthenticatedRequest("GET", GMAIL_LIST_HISTORY_ENDPOINT, {
            params: {
                maxResults: 500,
                startHistoryId,
            },
        });
    }

    private async makeAuthenticatedRequest<T>(
        method: string,
        url: string,
        options?: MakeRequestOptions,
    ): Promise<T> {
        if (!options) {
            options = {};
        }
        if (!options.headers) {
            options.headers = {};
        }
        const token = await this.getOrRefreshAccessToken();
        options.headers["Authorization"] = `Bearer ${token}`;
        return makeRequest(method, url, options);
    }

    private async getOrRefreshAccessToken(): Promise<string> {
        if ((this.tokens.expiresAt - GoogleApi.tokenExpiryOffset) < Date.now()) {
            // TODO Refresh and save.
            //      And handle errors during expiry such as when user revoked consent.
            //      In that case, set active to false.
            // Honestly, you know. This should just be a class that encapsulates any kind
            // of access to KvUserSettings, so that there always is only one central copy.
            // With a static method to fetch a user by email etc.
        }
        return this.tokens.accessToken;
    }

}

export interface GmailGetProfileResult {
    emailAddress: string;
    historyId: string;
    messagesTotal: number;
    threadsTotal: number;
}

export interface GmailListHistoryResult {
    historyId: string;
    nextPageToken?: string;
    history?: GmailListHistoryEntry[];
}

export interface GmailListHistoryEntry {
    id: string;
    messages: GmailMessageBase[];
    messagesAdded: {
        message: GmailMessageBaseWithLabels;
    }[];
    messagesDeleted: {
        message: GmailMessageBaseWithLabels;
    }[];
    labelsAdded: {
        message: GmailMessageBaseWithLabels;
        labelIds: string[];
    }[];
    labelsRemoved: {
        message: GmailMessageBaseWithLabels;
        labelIds: string[];
    }[];
}

export interface GmailMessageBase {
    id: string;
    threadId: string;
}

export interface GmailMessageBaseWithLabels extends GmailMessageBase {
    labelIds: string[];
}
