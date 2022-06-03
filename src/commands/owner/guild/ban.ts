import { ApplicationCommandOptionType } from "discord.js";
import GuildConfig from "../../../lib/guildconfig.service";
import registerCommand from "../../../modules/command.register";
import { Command, returnMessage } from "../../../types/Command";
import RavenInteraction from "../../../types/interaction";

module.exports = class extends Command {
    constructor() {
        super({
            name: "ban",
            description: "ban a guild",

            args: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: "guild_id",
                    description: "guild id",
                    required: true,
                },
                {
                    type: ApplicationCommandOptionType.Boolean,
                    name: "state",
                    description: "ban status",
                    required: true,
                },
                {
                    type: ApplicationCommandOptionType.Boolean,
                    name: "leave",
                    description: "leave guild",
                    required: false,
                },
            ],

            throttling: {
                duration: 60,
                usages: 3,
            },
        });
    }

    async execute(msg: RavenInteraction): Promise<returnMessage> {
        const guildID = msg.options.getString("guild_id", true);
        const state = msg.options.getBoolean("state", true);
        const leave = msg.options.getBoolean("leave", false);

        const client = msg.client;
        const guild = client.guilds.cache.get(guildID);
        if (!guild) return { content: "Guild not found" };

        await client.db.guilds.update({
            where: { guild_id: guild.id },
            data: { banned: state },
        });

        if (state) await msg.guild?.commands.set([]);
        else await registerCommand(client, guild);
        await GuildConfig.updateGuild(guild.id);

        let left = false;
        if (leave && state) {
            const leaveGuild = await guild.leave();
            if (leaveGuild) left = true;
        }

        return {
            content: `ban state: \`${state ? "true" : "false"}\`\nLeft: \`${
                left ? "true" : "false"
            }\`\nName: \`${guild.name}\``,
        };
    }
};
