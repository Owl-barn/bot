import { sessions } from ".prisma/client";
import { Request } from "express";

export interface OauthResponse {
    access_token: string;
    expires_in: number;
    refresh_token: string;
    scope: string;
    token_type: string;
}

export interface RavenRequest extends Request {
    user?: sessions;
}