import { sessions } from ".prisma/client";
import { NextFunction, Response } from "express";
import * as jwt from "jsonwebtoken";
import WrongTokenException from "../exceptions/BadToken";
import HttpException from "../exceptions/httpExceptions";
import { RavenRequest } from "../types/web";

async function authMiddleware(req: RavenRequest, _res: Response, next: NextFunction): Promise<void> {
    const cookies: jwt.JwtPayload = req.signedCookies;
    if (req.headers.authorization === process.env.API_KEY) {
        req.user = "a";
        next();
        return;
    }
    if (cookies && cookies.session) {
        try {
            const tokenData = jwt.verify(cookies.session, process.env.JWT_SECRET as string) as sessions;
            // const user = await prisma.sessions.findFirst({ where: { session_id: tokenData.session_id } });
            if (tokenData) {
                req.user = tokenData;
                next();
            } else {
                next(new WrongTokenException());
            }
        } catch (error) {
            console.log(error);
            next(new WrongTokenException());
        }
    } else {
        next(new HttpException(401, "Unauthorised"));
    }
}

export default authMiddleware;