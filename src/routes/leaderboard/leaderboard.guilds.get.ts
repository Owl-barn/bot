import { Response } from "express";
import bot from "../../bot";
import prisma from "../../lib/db.service";
import { RavenRequest } from "../../types/web";

const guildsGet = async (req: RavenRequest, res: Response): Promise<void> => {
    const guilds = await prisma.guilds.findMany({ where: { level: true } });
    const client = bot.getClient();

    const response = [];
    for (const guild of guilds) {
        const guildCache = client.guilds.cache.get(guild.guild_id);
        if (!guildCache || !guildCache.available) continue;
        response.push({ id: guild.guild_id });
    }

    res.json(response);
};

export default guildsGet;
