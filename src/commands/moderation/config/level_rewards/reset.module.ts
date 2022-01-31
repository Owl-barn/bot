import { GuildMember, HexColorString, MessageEmbed } from "discord.js";
import { returnMessage } from "../../../../types/Command";
import RavenInteraction from "../../../../types/interaction";

export async function configLevelRewardReset(msg: RavenInteraction): Promise<returnMessage> {
    if (!msg.guildId) throw "no guild??";

    const failEmbed = new MessageEmbed()
        .setColor(process.env.EMBED_FAIL_COLOR as HexColorString);

    if (!(msg.member as GuildMember).permissions.has("ADMINISTRATOR")) {
        return { embeds: [failEmbed.setDescription("You need administator permissions to do this.")] };
    }

    const deleted = await msg.client.db.level_reward.deleteMany({ where: { guild_id: msg.guildId } });

    const embed = new MessageEmbed()
        .setDescription(`Successfully removed ${deleted.count} level rewards.`)
        .setColor(process.env.EMBED_COLOR as HexColorString);

    return { embeds: [embed] };
}