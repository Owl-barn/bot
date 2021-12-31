import { GuildMember, MessageEmbed, HexColorString } from "discord.js";
import moment from "moment";
import { getStarSign, nextDate, yearsAgo } from "../../../lib/functions.service";
import { returnMessage } from "../../../types/Command";
import RavenInteraction from "../../../types/interaction";

export default async function birthdayGet(msg: RavenInteraction): Promise<returnMessage> {
    if (!msg.guildId) throw "No guildID???";

    const client = msg.client;
    let user = msg.options.getMember("user") as GuildMember | undefined;

    if (!user) user = msg.member as GuildMember;

    const query = await client.db.birthdays.findUnique({ where: { user_id_guild_id: { user_id: user.id, guild_id: msg.guildId } } });

    const embed = new MessageEmbed()
        .setColor(process.env.EMBED_COLOR as HexColorString)
        .setTitle(`${user.user.username}'s birthday`);

    if (!query?.birthday) {
        embed.setDescription("This user has no birthday registered");
        return { embeds: [embed] };
    }

    const nextBirthday = nextDate(new Date(query.birthday));
    const age = yearsAgo(query.birthday);
    const starSign = getStarSign(query.birthday);

    embed
        .addField(`Birth Date`, `**${user.id === msg.user.id ? `you were` : `<@!${user.id}> was`} born on** ${moment(query.birthday).format("DD-MM-YYYY")}`)
        .addField(`Info`, `**Age:** ${age} years \n**Next birthday:** <t:${Number(nextBirthday) / 1000}:R>`, true)
        .addField("Star sign", `${starSign?.name} ${starSign?.icon}`, true)
        .addField("Note", "All times are recorded in UTC timezone. The “next birthday” and birthday role times may be inaccurate due to this.");

    return { embeds: [embed] };
}