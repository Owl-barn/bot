import { Request, Response } from "express";
import HttpException from "../../exceptions/httpExceptions";
import prisma from "../../lib/db.service";
import { OauthResponse } from "../../types/web";
import jwt from "jsonwebtoken";
import { URLSearchParams } from "url";
import fetch from "got";
import { User } from "discord.js";
import env from "../../modules/env";

export default class OauthGetService {
    public async execute(req: Request, res: Response): Promise<void> {
        const code = req.query.code as string;

        if (!code) throw new HttpException(403, "bad request");

        const data = new URLSearchParams({
            client_id: env.CLIENT_ID,
            client_secret: env.CLIENT_SECRET,
            code: code,
            grant_type: "authorization_code",
            redirect_uri: "https://api.xayania.com/oauth",
            scope: "identify",
        });

        // Get token.
        const oauthResult = await fetch
            .post("https://discord.com/api/oauth2/token", { form: data })
            .catch((e) => console.error(e.response.body));

        if (!oauthResult || !oauthResult.body) return;
        const token = JSON.parse(oauthResult.body) as OauthResponse;
        console.log(token);

        // Get user.
        const userResult = await fetch("https://discord.com/api/users/@me", {
            headers: {
                authorization: `${token.token_type} ${token.access_token}`,
            },
        });

        if (!userResult || !userResult.body) return;
        const user = JSON.parse(userResult.body) as User;
        console.log(user);

        const session = await prisma.sessions.create({
            data: {
                expire: new Date(Date.now() + token.expires_in),
                refresh_token: token.refresh_token,
                access_token: token.access_token,
                user_id: user.id,
            },
        });

        const signedSesion = jwt.sign(session, env.JWT_SECRET);

        res.cookie("session", signedSesion, {
            signed: true,
            domain: ".xayania.com",
            secure: true,
        });
        res.redirect("https://raven.xayania.com/guilds");
    }
}
