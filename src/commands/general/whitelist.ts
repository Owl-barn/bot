import {
    GuildMember,
    HexColorString,
    EmbedBuilder,
    ApplicationCommandOptionType,
} from "discord.js";
import { Command, returnMessage } from "../../types/Command";
import RavenInteraction from "../../types/interaction";
import { getMcUUID, RCONHandler } from "../../lib/mc.service";
import { CommandGroup } from "../../types/commandGroup";

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

        const embed = new EmbedBuilder().setColor(
            process.env.EMBED_COLOR as HexColorString,
        );

        const failEmbed = new EmbedBuilder().setColor(
            process.env.EMBED_FAIL_COLOR as HexColorString,
        );

        username = username.trim().substr(0, 64);
        const author = msg.member as GuildMember;

        // Get guild.
        const rconGuild = await msg.client.db.rcon.findFirst({
            where: { guild_id: author.guild.id },
        });

        // Check if connected server.
        if (rconGuild === null) {
            const response = failEmbed.setDescription(
                "No minecraft server connected to this guild.",
            );
            return { embeds: [response] };
        }

        // Get UUID
        let uuid = await getMcUUID(username);

        // Check if exists.
        if (!uuid)
            return {
                embeds: [failEmbed.setDescription("mc account doesn't exist")],
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
            const response = failEmbed.setDescription(
                "You already have an account linked.",
            );
            return { embeds: [response] };
        }

        // Execute command.
        const response = await RCONHandler(`whitelist add ${username}`, {
            host: rconGuild.host,
            port: rconGuild.port,
            password: rconGuild.password,
        });

        // If already whitelisted.
        if (response.code !== "SUCCESS")
            return { embeds: [failEmbed.setDescription(response.message)] };

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
        author.setNickname(username);

        // Respond.
        return { embeds: [embed.setDescription("You've been whitelisted!")] };
    }
};
