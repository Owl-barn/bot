import { HexColorString, EmbedBuilder, Role } from "discord.js";
import { returnMessage } from "../../../../types/Command";
import RavenInteraction from "../../../../types/interaction";

export async function configLevelRewardAdd(
    msg: RavenInteraction,
): Promise<returnMessage> {
    if (!msg.guildId) throw "no guild??";
    const level = msg.options.getInteger("level", true);
    const role = msg.options.getRole("role", true) as Role;

    const failEmbed = new EmbedBuilder().setColor(
        process.env.EMBED_FAIL_COLOR as HexColorString,
    );

    if (!role.editable)
        return {
            embeds: [failEmbed.setDescription("I cant assign that role")],
        };

    await msg.client.db.level_reward.create({
        data: { guild_id: msg.guildId, role_id: role.id, level },
    });

    const embed = new EmbedBuilder()
        .setDescription(
            `Successfully added ${role} as a level reward for level \`${level}\`.`,
        )
        .setColor(process.env.EMBED_COLOR as HexColorString);

    return { embeds: [embed] };
}
