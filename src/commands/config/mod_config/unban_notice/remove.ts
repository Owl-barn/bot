import { embedTemplate } from "../../../../lib/embedTemplate";
import GuildConfig from "../../../../lib/guildconfig.service";
import { returnMessage, SubCommand } from "../../../../types/Command";
import RavenInteraction from "../../../../types/interaction";

module.exports = class extends SubCommand {
    constructor() {
        super({
            name: "remove",
            description: "Removes the unban notice.",

            botPermissions: ["BanMembers"],

            throttling: {
                duration: 60,
                usages: 2,
            },
        });
    }

    async execute(msg: RavenInteraction): Promise<returnMessage> {
        if (!msg.guildId) throw "No guildID???";

        const guild = await msg.client.db.guilds.update({
            where: { guild_id: msg.guildId },
            data: { unban_notice: null },
        });

        await GuildConfig.updateGuild(guild);

        const embed = embedTemplate();
        embed.setDescription(`The unban notice has successfully been removed.`);

        return { embeds: [embed] };
    }
};
