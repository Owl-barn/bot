import { Util, ApplicationCommandOptionType } from "discord.js";
import { embedTemplate } from "../../../../lib/embedTemplate";
import GuildConfig from "../../../../lib/guildconfig.service";
import { returnMessage, SubCommand } from "../../../../types/Command";
import RavenInteraction from "../../../../types/interaction";

module.exports = class extends SubCommand {
    constructor() {
        super({
            name: "set",
            description: "Sets the unban notice.",

            botPermissions: ["BanMembers"],

            arguments: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: "unban_notice",
                    description: "The unban notice",
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
        let unban_notice = msg.options.getString("unban_notice", true);
        unban_notice = Util.escapeMarkdown(unban_notice).substring(0, 255);

        const guild = await msg.client.db.guilds.update({
            where: { guild_id: msg.guildId },
            data: { unban_notice },
        });

        await GuildConfig.updateGuild(guild);

        const embed = embedTemplate()
            .setTitle("Unban Notice Set")
            .setDescription(
                `The unban notice is now:\n\`\`\`${unban_notice}\`\`\``,
            );

        return { embeds: [embed] };
    }
};
