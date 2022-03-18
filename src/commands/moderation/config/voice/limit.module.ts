import { MessageEmbed, HexColorString } from "discord.js";
import { returnMessage } from "../../../../types/Command";
import RavenInteraction from "../../../../types/interaction";

export default async function configVoiceLimit(msg: RavenInteraction): Promise<returnMessage> {
    if (!msg.guildId) throw "No guildID???";

    const embed = new MessageEmbed()
        .setDescription("a")
        .setColor(process.env.EMBED_COLOR as HexColorString);

    return { embeds: [embed] };
}