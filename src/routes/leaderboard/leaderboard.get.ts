import { NextFunction, Response } from "express";
import bot from "../../app";
import NotFoundException from "../../exceptions/notFound";
import prisma from "../../lib/db.service";
import levelService from "../../lib/level.service";
import { RavenRequest } from "../../types/web";

const leaderboardGet = async (req: RavenRequest, res: Response, next: NextFunction): Promise<void> => {
    const guildID = req.params.id;
    const client = bot.getClient();

    const leaderboard = await prisma.level.findMany({ where: { guild_id: guildID }, orderBy: { experience: "desc" }, take: 50 });
    const guild = client.guilds.cache.get(guildID);

    if (!guild || !guild.available) next(new NotFoundException());

    const users = [];
    for (const x of leaderboard) {
        const user = guild?.members.resolveId(x.user_id);
        if (!user) continue;
        users.push(user);
    }

    const members = await guild?.members.fetch({ user: users });

    const response = [];
    for (const x of leaderboard) {
        const y: any = x;
        y.experience = levelService.calculateLevel(x.experience);
        y.member = members?.get(x.user_id);
        if (!y.member) continue;

        response.push(x);
    }

    response.splice(25, response.length - 25);


    res.json(response);
};

export default leaderboardGet;