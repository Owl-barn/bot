import { MessageEmbed, HexColorString } from "discord.js";
import { returnMessage } from "../../../../types/Command";
import RavenInteraction from "../../../../types/interaction";

export default async function configPermissionList(msg: RavenInteraction): Promise<returnMessage> {
    if (!msg.guildId) throw "No guildID???";
    const client = msg.client;

    const permissions = await client.db.permissions.findMany({ where: { guild_id: msg.guildId }, orderBy: { command: "asc" } });

    let result = "";

    for (const perm of permissions) {
        result += ` - ${perm.permission ? "✅" : "❎"} ${perm.command} <@${perm.type === "ROLE" ? "&" : ""}${perm.target}>\n`;
    }


    if (result.length === 0) result = "No command overrides";

    const embed = new MessageEmbed()
        .setDescription(result)
        .setColor(process.env.EMBED_COLOR as HexColorString);

    return { embeds: [embed] };
}