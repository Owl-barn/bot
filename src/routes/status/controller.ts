import { Router, Request, Response, NextFunction } from "express";
import bot from "../../bot";
import Controller from "../../types/controller";

class StatusController implements Controller {
    public path = "/status";
    public router = Router();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes = () => {
        this.router.get(this.path, this.getStatus);
    };

    private getStatus = async (
        _req: Request,
        res: Response,
        _next: NextFunction,
    ) => {
        const client = bot.getClient();
        const memberCount = client.guilds.cache.reduce(
            (acc, guild) => acc + guild.memberCount,
            0,
        );

        const guildCount = client.guilds.cache.size;

        res.status(200).send({
            memberCount,
            guildCount,
            uptime: client.uptime,
        });
    };
}

export default StatusController;
