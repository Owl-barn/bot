import { ButtonBuilder, ButtonStyle, ActionRowBuilder } from "discord.js";
import { embedTemplate, failEmbedTemplate } from "../../../lib/embedTemplate";
import GuildConfig from "../../../lib/guildconfig.service";
import env from "../../../modules/env";
import { returnMessage, SubCommand } from "../../../types/Command";
import RavenInteraction from "../../../types/interaction";

module.exports = class extends SubCommand {
    constructor() {
        super({
            name: "top",
            description: "View the server leaderboard.",

            throttling: {
                duration: 60,
                usages: 3,
            },
        });
    }

    async execute(msg: RavenInteraction): Promise<returnMessage> {
        if (!msg.guildId) throw "Level Command didnt get guildID";
        const embed = embedTemplate();
        const failEmbed = failEmbedTemplate();

        const config = GuildConfig.getGuild(msg.guildId);
        if (!config || !config.levelEnabled) {
            const response = failEmbed.setDescription(
                "Leveling is not enabled on this server.",
            );
            return { embeds: [response] };
        }

        embed.setTitle(`${msg.guild?.name} leaderboard`);
        embed.setDescription(
            "Click the link below to view the server's leaderboard",
        );

        const button = new ButtonBuilder()
            .setLabel("Leaderboard")
            .setStyle(ButtonStyle.Link)
            .setURL(`${env.URL}/leaderboard/${msg.guildId}`);

        const component =
            new ActionRowBuilder() as ActionRowBuilder<ButtonBuilder>;
        component.addComponents([button]);

        return { embeds: [embed], components: [component] };
    }
};
