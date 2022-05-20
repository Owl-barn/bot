import { Router, Response, NextFunction } from "express";
import authMiddleware from "../../middleware/auth.middleware";
import Controller from "../../types/controller";
import { RavenRequest } from "../../types/web";
import GuildGetService from "./user.guild.get.service";
import GuildsGetService from "./user.guilds.get.service";

export default class GuildsController implements Controller {
    public path = "/guild";
    public router = Router();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes = () => {
        this.router.get(`${this.path}/:id`, authMiddleware, this.getGuild);
        this.router.get(this.path, authMiddleware, this.getGuilds);
    };

    private getGuild = async (
        req: RavenRequest,
        res: Response,
        next: NextFunction,
    ) => {
        GuildGetService(req, res).catch((e) => next(e));
    };

    private getGuilds = async (
        req: RavenRequest,
        res: Response,
        next: NextFunction,
    ) => {
        GuildsGetService(req, res).catch((e) => next(e));
    };
}

export interface GuildItem {
    name: string;
    icon: string;
    id: string;
    roles?: unknown[];
}
