import { HexColorString, MessageEmbed, Role } from "discord.js";
import { returnMessage } from "../../../../types/Command";
import RavenInteraction from "../../../../types/interaction";

export async function configLevelRewardRemove(msg: RavenInteraction): Promise<returnMessage> {
    if (!msg.guildId) throw "no guild??";
    const role = msg.options.getRole("role", true) as Role;

    await msg.client.db.level_reward.delete({ where: { role_id: role.id } });

    const embed = new MessageEmbed()
        .setDescription(`Successfully removed ${role} as a level reward.`)
        .setColor(process.env.EMBED_COLOR as HexColorString);

    return { embeds: [embed] };
}