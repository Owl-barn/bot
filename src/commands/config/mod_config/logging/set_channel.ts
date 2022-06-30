import { ApplicationCommandOptionType } from "discord.js";
import { embedTemplate } from "../../../../lib/embedTemplate";
import GuildConfig from "../../../../lib/guildconfig.service";
import { returnMessage, SubCommand } from "../../../../types/Command";
import RavenInteraction from "../../../../types/interaction";

module.exports = class extends SubCommand {
    constructor() {
        super({
            name: "set_channel",
            description: "Set the channel to send the logs to",

            arguments: [
                {
                    type: ApplicationCommandOptionType.Channel,
                    name: "channel",
                    description: "The channel to send the logs to.",
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
        if (!msg.guildId) throw "No guildID???";

        const channel = msg.options.getChannel("channel", true);

        const guild = await msg.client.db.guilds.update({
            where: { guild_id: msg.guildId },
            data: { log_channel: channel.id },
        });

        await GuildConfig.updateGuild(guild);

        const embed = embedTemplate();
        embed.setDescription(
            `The bot will now send its event logs to <#${channel.id}>`,
        );

        return { embeds: [embed] };
    }
};
