import { GuildMember, ApplicationCommandOptionType } from "discord.js";
import { Command, returnMessage } from "../../types/Command";
import RavenInteraction from "../../types/interaction";
import { getMcUUID, RCONHandler } from "../../lib/mc.service";
import { CommandGroup } from "../../types/commandGroup";
import { embedTemplate, failEmbedTemplate } from "../../lib/embedTemplate";

module.exports = class extends Command {
    constructor() {
        super({
            name: "whitelist",
            description: "whitelist to mc server",
            group: CommandGroup.general,

            guildOnly: true,

            arguments: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: "mc_name",
                    description: "What mc account to whitelist",
                    required: true,
                },
            ],

            throttling: {
                duration: 60,
                usages: 2,
            },
        });
    }
    async execute(msg: RavenInteraction): Promise<returnMessage> {
        const db = msg.client.db;
        let username = msg.options.getString("mc_name", true);

        await msg.deferReply();

        username = username.trim().substring(0, 64);
        const author = msg.member as GuildMember;

        // Get guild.
        const rconGuild = await msg.client.db.rcon.findFirst({
            where: { guild_id: author.guild.id },
        });

        // Check if connected server.
        if (rconGuild === null) {
            const response = failEmbedTemplate(
                "No minecraft server connected to this guild.",
            );
            return { embeds: [response] };
        }

        // Get UUID
        let uuid = await getMcUUID(username);

        // Check if exists.
        if (!uuid)
            return {
                embeds: [failEmbedTemplate("mc account doesn't exist")],
            };

        uuid = uuid as string;

        // Check if already registered.
        const userExists = await db.whitelist.findFirst({
            where: {
                OR: [{ user_id: author.id }, { mc_uuid: uuid }],
            },
        });

        // Check if already in db.
        if (userExists !== null) {
            const response = failEmbedTemplate(
                "You already have an account linked.",
            );
            return { embeds: [response] };
        }

        // Execute command.
        const response = await RCONHandler([`whitelist add ${username}`], {
            host: rconGuild.host,
            port: rconGuild.port,
            password: rconGuild.password,
        }).catch(() => null);

        // If already whitelisted.
        if (response === null) {
            const fail = failEmbedTemplate(
                "This account is already whitelisted or the server couldnt be reached",
            );
            return { embeds: [fail] };
        }

        // Add to db.
        await db.whitelist.create({
            data: {
                user_id: author.id,
                mc_uuid: uuid,
                guild_id: author.guild.id,
            },
        });

        // Give role.
        if (rconGuild.role_id) author.roles.add(rconGuild.role_id);

        // Set Nickname.
        author.setNickname(username).catch(() => null);

        // Respond.
        return { embeds: [embedTemplate("You've been whitelisted!")] };
    }
};
