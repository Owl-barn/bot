import { ApplicationCommandOptionType } from "discord.js";
import { embedTemplate } from "../../../../lib/embedTemplate";
import { Command, returnMessage } from "../../../../types/Command";
import RavenInteraction from "../../../../types/interaction";

module.exports = class extends Command {
    constructor() {
        super({
            name: "limit",
            description: "Sets the private voice channel limit",

            args: [
                {
                    name: "limit",
                    type: ApplicationCommandOptionType.Integer,
                    min: 0,
                    max: 10,
                    description: "The limit of private voice channels",
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
        if (!msg.guildId) throw "No guildID???";
        const limit = msg.options.getInteger("limit", true);

        const guild = await msg.client.db.guilds.update({
            where: { guild_id: msg.guildId },
            data: { vc_limit: limit },
        });

        const embed = embedTemplate();
        embed.setDescription(
            `Successfully set the private voice channel limit to ${guild.vc_limit}`,
        );

        return { embeds: [embed] };
    }
};
