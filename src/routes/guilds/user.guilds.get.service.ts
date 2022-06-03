import { Guild, GuildMember, PermissionFlagsBits } from "discord.js";
import { Response } from "express";
import fetch from "got";
import bot from "../../bot";
import ForbiddenException from "../../exceptions/forbidden";
import HttpException from "../../exceptions/httpExceptions";
import webCache from "../../lib/webCache.service";
import { RavenRequest } from "../../types/web";

const GuildsGetService = async (
    req: RavenRequest,
    res: Response,
): Promise<void> => {
    if (!req.user) throw new ForbiddenException();

    // await new Promise((x) => setTimeout(x, 1000));

    const cache = webCache.getGuilds(req.user.user_id);
    if (cache) {
        res.json(cache);
        return;
    }

    const client = bot.getClient();

    const clientGuilds = await client.guilds.cache;

    const guildRes = await fetch("https://discord.com/api/users/@me/guilds", {
        headers: { authorization: `Bearer ${req.user.access_token}` },
    });

    if (!guildRes || !guildRes.body)
        throw new HttpException(401, "error getting guild");
    const guilds = JSON.parse(guildRes.body) as Guild[];

    if (!guilds) throw new HttpException(401, "error getting guilds");

    const responseGuilds: responseGuilds[] = [];

    await guilds.forEach(async (guild) => {
        const botGuild = clientGuilds.get(guild.id);
        if (!botGuild) return;
        const botGuildMember = (await botGuild.members.fetch({
            user: req.user?.user_id,
        })) as unknown as GuildMember;
        if (!botGuildMember) return;
        if (
            !botGuildMember.permissions.has(
                PermissionFlagsBits.Administrator,
            ) &&
            botGuildMember.id !== "140762569056059392"
        )
            return;

        responseGuilds.push({
            name: guild.name,
            icon: guild.icon as string,
            id: guild.id,
        });
    });

    webCache.setGuilds(req.user.user_id, responseGuilds);

    res.json(responseGuilds);
};

export default GuildsGetService;

interface responseGuilds {
    name: string;
    icon: string;
    id: string;
}
