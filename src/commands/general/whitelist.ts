import { GuildMember } from "discord.js";
import { argumentType } from "../../types/argument";
import { Command, returnMessage } from "../../types/Command";
import RavenInteraction from "../../types/interaction";
import { getMcUUID, RCONHandler } from "../../lib/mc.service";


module.exports = class extends Command {
    constructor() {
        super({
            name: "whitelist",
            description: "whitelist to mc server",
            group: "general",

            guildOnly: true,
            adminOnly: false,

            args: [
                {
                    type: argumentType.string,
                    name: "mc_name",
                    description: "What mc account to whitelist",
                    required: true,
                },
            ],

            throttling: {
                duration: 60,
                usages: 1,
            },
        });
    }
    async execute(msg: RavenInteraction): Promise<returnMessage> {
        const db = msg.client.db;
        let username = msg.options.getString("mc_name");

        if (!username) throw "Invalid name";

        await msg.deferReply();

        username = username.trim().substr(0, 64);
        const author = msg.member as GuildMember;

        // Get guild.
        const rconGuild = await msg.client.db.rcon.findFirst({ where: { guild_id: author.guild.id } });

        // Check if connected server.
        if (rconGuild === null) return { ephemeral: true, content: "No minecraft server connected to this guild." };

        // Get UUID
        let uuid = await getMcUUID(username);

        // Check if exists.
        if (!uuid) return { ephemeral: true, content: "mc account doesn't exist" };
        uuid = uuid as string;

        // Check if already registered.
        const userExists = await db.whitelist.findFirst({ where: { OR: [{ user_id: author.id }, { mc_uuid: uuid }] } });

        // Check if already in db.
        if (userExists !== null) return { ephemeral: true, content: "You already have an account linked." };

        // Execute command.
        const response = await RCONHandler(`whitelist add ${username}`, { host: rconGuild.host, port: rconGuild.port, password: rconGuild.password });

        // If already whitelisted.
        if (response.code !== "SUCCESS") return { ephemeral: true, content: response.message };

        // Add to db.
        await db.whitelist.create({ data: { user_id: author.id, mc_uuid: uuid, guild_id: author.guild.id } });

        // Give role.
        if (rconGuild.role_id) author.roles.add(rconGuild.role_id);

        // Set Nickname.
        author.setNickname(username);

        // Respond.
        return { content: "You've been whitelisted!" };
    }
};
