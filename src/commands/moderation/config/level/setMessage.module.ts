import { HexColorString, EmbedBuilder } from "discord.js";
import GuildConfig from "../../../../lib/guildconfig.service";
import { returnMessage } from "../../../../types/Command";
import RavenInteraction from "../../../../types/interaction";

export async function configLevelSetMessage(
    msg: RavenInteraction,
): Promise<returnMessage> {
    if (!msg.guildId) throw "no guild??";
    let message = msg.options.getString("message");

    const embed = new EmbedBuilder().setColor(
        process.env.EMBED_COLOR as HexColorString,
    );

    if (message) {
        message = message.substring(0, 256);
        embed.setDescription(
            `Successfully set the level up message to: \`\`\`${message}\`\`\``,
        );
    } else {
        embed.setDescription("successfully disabled the level up message");
    }

    const guild = await msg.client.db.guilds.update({
        where: { guild_id: msg.guildId },
        data: { level_message: message },
    });
    GuildConfig.updateGuild(guild);

    return { embeds: [embed] };
}
