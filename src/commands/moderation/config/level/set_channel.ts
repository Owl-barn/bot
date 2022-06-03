import { ApplicationCommandOptionType } from "discord.js";
import { embedTemplate } from "../../../../lib/embedTemplate";
import GuildConfig from "../../../../lib/guildconfig.service";
import { Command, returnMessage } from "../../../../types/Command";
import RavenInteraction from "../../../../types/interaction";

module.exports = class extends Command {
    constructor() {
        super({
            name: "set_channel",
            description: "Set the channel for level up messages",

            args: [
                {
                    type: ApplicationCommandOptionType.Channel,
                    name: "channel",
                    description: "What to set the level up channel to",
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
        if (!msg.guildId) throw "no guild??";
        const channel = msg.options.getChannel("channel");

        const embed = embedTemplate();

        channel
            ? embed.setDescription(
                  `Successfully set the level up channel to ${channel}`,
              )
            : embed.setDescription(
                  "successfully disabled the level up channel",
              );

        const guild = await msg.client.db.guilds.update({
            where: { guild_id: msg.guildId },
            data: { level_channel: channel?.id },
        });

        GuildConfig.updateGuild(guild);

        return { embeds: [embed] };
    }
};
