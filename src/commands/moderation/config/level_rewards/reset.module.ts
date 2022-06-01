import {
    GuildMember,
    HexColorString,
    EmbedBuilder,
    PermissionFlagsBits,
} from "discord.js";
import { returnMessage } from "../../../../types/Command";
import RavenInteraction from "../../../../types/interaction";

export async function configLevelRewardReset(
    msg: RavenInteraction,
): Promise<returnMessage> {
    if (!msg.guildId) throw "no guild??";

    const failEmbed = new EmbedBuilder().setColor(
        process.env.EMBED_FAIL_COLOR as HexColorString,
    );

    if (
        !(msg.member as GuildMember).permissions.has(
            PermissionFlagsBits.Administrator,
        )
    ) {
        const response = failEmbed.setDescription(
            "You need administator permissions to do this.",
        );
        return { embeds: [response] };
    }

    const deleted = await msg.client.db.level_reward.deleteMany({
        where: { guild_id: msg.guildId },
    });

    const embed = new EmbedBuilder()
        .setDescription(`Successfully removed ${deleted.count} level rewards.`)
        .setColor(process.env.EMBED_COLOR as HexColorString);

    return { embeds: [embed] };
}
