import { Response } from "express";
import bot from "../../app";
import ForbiddenException from "../../exceptions/forbidden";
import { RavenRequest } from "../../types/web";

const GuildGetService = async (req: RavenRequest, res: Response): Promise<void> => {
    if (!req.user) throw new ForbiddenException();

    const guildID = req.params.id;
    const client = bot.getClient();

    if (!client.user) return;

    const guild = client.guilds.cache.get(guildID);
    const commands = await guild?.commands.fetch();
    if (!commands) return;
    const self = commands.filter(x => x.applicationId === client.user.id);

    console.log(guild?.name);
    guild?.memberCount;

    res.json(guild);
};

export default GuildGetService;