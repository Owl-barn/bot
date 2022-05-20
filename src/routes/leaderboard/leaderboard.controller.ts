import { Router, Response, NextFunction } from "express";
import Controller from "../../types/controller";
import { RavenRequest } from "../../types/web";
import leaderboardGet from "./leaderboard.get";
import guildsGet from "./leaderboard.guilds.get";

export default class LeaderboardController implements Controller {
    public path = "/leaderboard";
    public router = Router();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes = () => {
        this.router.get(`${this.path}/:id`, this.getLeaderboard);
        this.router.get(this.path, this.getLeaderboardGuilds);
    };

    private getLeaderboard = async (
        req: RavenRequest,
        res: Response,
        next: NextFunction,
    ) => {
        leaderboardGet(req, res, next).catch((e) => next(e));
    };

    private getLeaderboardGuilds = async (
        req: RavenRequest,
        res: Response,
        next: NextFunction,
    ) => {
        guildsGet(req, res).catch((e) => next(e));
    };
}

export interface GuildItem {
    name: string;
    icon: string;
    id: string;
    roles?: unknown[];
}
