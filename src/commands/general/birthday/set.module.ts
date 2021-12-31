import { MessageEmbed, HexColorString } from "discord.js";
import moment from "moment";
import { getStarSign, nextDate, yearsAgo } from "../../../lib/functions.service";
import { returnMessage } from "../../../types/Command";
import RavenInteraction from "../../../types/interaction";

interface dateInput {
    day: string | number;
    month: string | number;
    year: string | number;
}

export default async function birthdaySet(msg: RavenInteraction): Promise<returnMessage> {
    if (!msg.guildId) throw "No guildID???";

    const client = msg.client;
    const birthday = msg.options.getString("birthday", true);
    const birthdayCheck = new RegExp(/(?<day>[0-9]{1,2})[/:-](?<month>[0-9]{1,2})[/:-](?<year>[0-9]{4})/g);

    const embed = new MessageEmbed()
        .setColor(process.env.EMBED_COLOR as HexColorString);

    const match = Array.from(birthday.matchAll(birthdayCheck));

    if (!match[0]?.groups) return { ephemeral: true, content: "Invalid input format, the format is `DD/MM/YYYY`" };

    let { day, month, year } = match[0]?.groups as unknown as dateInput;

    if (!day && !month && !year) return { ephemeral: true, content: "Invalid input format, the format is `DD/MM/YYYY`" };
    day = Number(day);
    month = Number(month);
    year = Number(year);

    const birthdayMoment = moment(birthday, "DD-MM-YYYY");

    if (birthdayMoment.isAfter(moment(Date.now()))) return { ephemeral: true, content: "That date is in the future." };

    if (!birthdayMoment.isValid()) return { content: "Invalid date" };

    const hasBirthday = await client.db.birthdays.findUnique({ where: { user_id_guild_id: { user_id: msg.user.id, guild_id: msg.guildId } } });
    if (hasBirthday && (Date.now() - Number(hasBirthday.updated)) > 600000) {

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


    const nextBirthday = nextDate(query.birthday as Date);
    const age = yearsAgo(birthdayMoment.toDate());
    const starSign = getStarSign(query.birthday as Date);

    embed.setTitle("Birthday set!")
        .addField(`Birth Date`, `**you were born on** ${birthdayMoment.format("DD-MM-YYYY")}`)
        .addField(`Info`, `**Age:** ${age} years \n**Next birthday:** <t:${Number(nextBirthday) / 1000}:R>`, true)
        .addField("Star sign", `${starSign?.name} ${starSign?.icon}`, true)
        .addField("Disclaimer", "All times are recorded in UTC timezone. The “next birthday” and birthday role times may be inaccurate due to this.");

    return { embeds: [embed] };
}