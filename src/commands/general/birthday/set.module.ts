import { MessageEmbed, HexColorString } from "discord.js";
import moment from "moment";
import { getStarSign, nextDate, yearsAgo } from "../../../lib/functions.service";
import { returnMessage } from "../../../types/Command";
import RavenInteraction from "../../../types/interaction";

export default async function birthdaySet(msg: RavenInteraction): Promise<returnMessage> {
    const client = msg.client;
    const birthday = msg.options.getString("birthday");
    const birthdayCheck = new RegExp(/^[0-9]{2}[/]{1}[0-9]{2}[/]{1}[0-9]{4}$/g);
    const embed = new MessageEmbed()
        .setColor(process.env.EMBED_COLOR as HexColorString);

    if (!msg.guildId) throw "No guildID???";

    if (!birthday) throw "no birthday!???";

    if (!birthdayCheck.test(birthday)) return { content: "Invalid input format, the format is `DD/MM/YYYY`" };

    const birthdayMoment = moment(birthday, "DD-MM-YYYY");
    if (!birthdayMoment.isValid()) return { content: "Invalid date" };

    const getBirthday = await client.db.birthdays.findUnique({ where: { user_id_guild_id: { user_id: msg.user.id, guild_id: msg.guildId } } });
    if (getBirthday && (Date.now() - Number(getBirthday.updated)) > 600000) {

        embed.addField("Not allowed", "You can only change your birthday once a year, dm <@140762569056059392> if there was a mistake");
        return { embeds: [embed] };
    }

    const query = await client.db.birthdays.upsert({
        where: {
            user_id_guild_id: {
                user_id: msg.user.id,
                guild_id: msg.guildId,
            },
        },
        create: {
            birthday: birthdayMoment.toDate(),
            user_id: msg.user.id,
            guild_id: msg.guildId,
        },
        update: {
            birthday: birthdayMoment.toDate(),
            updated: undefined,
        },
    });


    const nextBirthday = nextDate(query.birthday);
    const age = yearsAgo(birthdayMoment.toDate());
    const starSign = getStarSign(query.birthday);

    embed.setTitle("Birthday set!")
        .addField(`Birth Date`, `**you were born on** ${birthdayMoment.format("DD-MM-YYYY")}`)
        .addField(`Info`, `**Age:** ${age} years \n**Next birthday:** <t:${Number(nextBirthday) / 1000}:R>`, true)
        .addField("Star sign", `${starSign?.name} ${starSign?.icon}`, true)
        .addField("Disclaimer", "The time is displayed in utc relative to your timezone so it may show up wrong");

    return { embeds: [embed] };
}