import { HexColorString, MessageEmbed } from "discord.js";
import { returnMessage } from "../../../../types/Command";
import RavenInteraction from "../../../../types/interaction";

export async function configLevelRewardList(msg: RavenInteraction): Promise<returnMessage> {
    if (!msg.guildId) throw "no guild??";

    const rewards = await msg.client.db.level_reward.findMany({ where: { guild_id: msg.guildId }, orderBy: { level: "asc" } });

    const output = rewards.map(x => `${x.level} - <@&${x.role_id}>`).join("\n");

    const embed = new MessageEmbed()
        .setTitle("Level rewards")
        .setDescription(output || "No rewards.")
        .setColor(process.env.EMBED_COLOR as HexColorString);

    return { embeds: [embed] };
}