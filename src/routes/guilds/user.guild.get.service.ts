import { Response } from "express";
import bot from "../../bot";
import ForbiddenException from "../../exceptions/forbidden";
import NotFoundException from "../../exceptions/notFound";
import { RavenRequest } from "../../types/web";

const GuildGetService = async (
    req: RavenRequest,
    res: Response,
): Promise<void> => {
    if (!req.user) throw new ForbiddenException();

    const guildID = req.params.id;
    const client = bot.getClient();

    if (client.user === null) return;

    const guild = client.guilds.cache.get(guildID);
    if (!guild) throw new NotFoundException();
    let commands = await guild?.commands.fetch();
    if (commands)
        commands = commands.filter((x) => x.applicationId === client.user!.id);

    const response: webGuild = {
        name: guild.name,
        id: guild.id,
        icon: guild.icon,
        memberCount: guild.memberCount,
        roles: guild.roles.cache
            .map((x) => {
                return { name: x.name, id: x.id, index: x.position };
            })
            .sort((a, b) => {
                return b.index - a.index;
            }),
        commands: client.commands.map((x) => {
            return {
                name: x.name,
                enabled: commands.find((y) => y.name == x.name) !== undefined,
            };
        }),
    };

    res.json(response);
};

export default GuildGetService;

interface webGuild {
    name: string;
    id: string;
    icon: string | null;
    memberCount: number;
    roles: webRole[];
    commands: webCommands[];
}

interface webRole {
    name: string;
    index: number;
    id: string;
}

interface webCommands {
    name: string;
    enabled: boolean;
}
