import { ApplicationCommandOptionType } from "discord.js";
import GuildConfig from "../../../lib/guildconfig.service";
import registerCommand from "../../../modules/command.register";
import { returnMessage, SubCommand } from "../../../types/Command";
import RavenInteraction from "../../../types/interaction";

module.exports = class extends SubCommand {
    constructor() {
        super({
            name: "premium",
            description: "sets guild premium state",

            arguments: [
                {
                    type: ApplicationCommandOptionType.Boolean,
                    name: "state",
                    description: "premium status",
                    required: true,
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: "guild_id",
                    description: "guild id",
                    required: true,
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
        const premium = msg.options.getBoolean("state", true);
        const client = msg.client;

        const guild = client.guilds.cache.get(guildID);

        if (!guild) return { content: "Guild not found" };

        await client.db.guilds.update({
            where: { guild_id: guild.id },
            data: { premium },
        });

        await registerCommand(client, guild);
        await GuildConfig.updateGuild(guild.id);

        return { content: `${guild.name}'s premium was set to \`${premium}\`` };
    }
};
