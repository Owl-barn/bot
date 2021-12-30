import { MessageEmbed, HexColorString } from "discord.js";
import { returnMessage } from "../../../types/Command";
import RavenInteraction from "../../../types/interaction";

export default async function birthdaySync(msg: RavenInteraction): Promise<returnMessage> {
    if (!msg.guildId) throw "No guildID???";

    const client = msg.client;
    const embed = new MessageEmbed();
    embed.setColor(process.env.EMBED_COLOR as HexColorString);


    const query = await client.db.birthdays.findFirst({ where: { user_id: msg.user.id } });

    if (!query) return { embeds: [embed.setDescription("You dont have a birthday registered anywhere else.")] };
    const result = await client.db.birthdays.create({ data: { user_id: query.user_id, guild_id: msg.guildId, birthday: query.birthday } }).catch(() => null);

    if (!result) return { embeds: [embed.setDescription("You already have a birthday registered here")] };

    return { embeds: [embed.setDescription("birthday has been transferred!")] };
}