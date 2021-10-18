import { Router, Response, NextFunction } from "express";
import authMiddleware from "../../middleware/auth.middleware";
import Controller from "../../types/controller";
import { RavenRequest } from "../../types/web";
import GuildGetService from "./guild.get.service";
import GuildsGetService from "./guilds.get.service";

export default class GuildsController implements Controller {
    public path = "/guilds";
    public router = Router();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes = () => {
        this.router.get(`${this.path}/:id`, authMiddleware, this.getGuild);
        this.router.get(this.path, authMiddleware, this.getGuilds);
    }

    private getGuild = async (req: RavenRequest, res: Response, next: NextFunction) => {
        GuildGetService(req, res).catch(e => next(e));
    }

    private getGuilds = async (req: RavenRequest, res: Response, next: NextFunction) => {
        GuildsGetService(req, res).catch(e => next(e));
    }

}


export interface GuildItem {
    name: string;
    icon: string;
    id: string;
    roles?: unknown[]
}