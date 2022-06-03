import { ApplicationCommandOptionType } from "discord.js";
import moment from "moment";
import { embedTemplate, failEmbedTemplate } from "../../../lib/embedTemplate";
import { nextDate, yearsAgo, getStarSign } from "../../../lib/functions";
import { returnMessage, SubCommand } from "../../../types/Command";
import RavenInteraction from "../../../types/interaction";

module.exports = class extends SubCommand {
    constructor() {
        super({
            name: "set",
            description: "Add your birthday to the bot!",

            arguments: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: "birthday",
                    description:
                        "your birthday date formatted like: dd/mm/yyyy",
                    required: true,
                },
            ],

            throttling: {
                duration: 60,
                usages: 3,
            },
        });
    }

    async execute(msg: RavenInteraction): Promise<returnMessage> {
        if (!msg.guildId) throw "No guildID???";

        const client = msg.client;
        const birthday = msg.options.getString("birthday", true);
        const birthdayCheck = new RegExp(
            /(?<day>[0-9]{1,2})[/:-](?<month>[0-9]{1,2})[/:-](?<year>[0-9]{4})/g,
        );

        const embed = embedTemplate();
        const failEmbed = failEmbedTemplate();

        const match = Array.from(birthday.matchAll(birthdayCheck));

        if (!match[0]?.groups) {
            failEmbed.setDescription(
                "Invalid input format, the format is `DD/MM/YYYY`",
            );
            return { embeds: [failEmbed], ephemeral: true };
        }

        let { day, month, year } = match[0]?.groups as unknown as dateInput;

        if (!day && !month && !year) {
            failEmbed.setDescription(
                "Invalid input format, the format is `DD/MM/YYYY`",
            );
            return { embeds: [failEmbed], ephemeral: true };
        }

        day = Number(day);
        month = Number(month);
        year = Number(year);

        const birthdayMoment = moment(birthday, "DD-MM-YYYY");

        if (birthdayMoment.isAfter(moment(Date.now()))) {
            failEmbed.setDescription("That date is in the future");
            return { embeds: [failEmbed], ephemeral: true };
        }

        if (!birthdayMoment.isValid()) {
            failEmbed.setDescription("Invalid Date");
            return { embeds: [failEmbed], ephemeral: true };
        }

        const hasBirthday = await client.db.birthdays.findUnique({
            where: {
                user_id_guild_id: {
                    user_id: msg.user.id,
                    guild_id: msg.guildId,
                },
            },
        });

        if (hasBirthday && Date.now() - Number(hasBirthday.updated) > 600000) {
            failEmbed.setDescription(
                "You can only change your birthday once a year, contact an admin if there was a mistake",
            );
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

        embed.setTitle("Birthday set!").addFields([
            {
                name: `Birth Date`,
                value: `**you were born on** ${birthdayMoment.format(
                    "DD-MM-YYYY",
                )}`,
            },
            {
                name: `Info`,
                value:
                    `**Age:** ${age} years \n` +
                    `**Next birthday:** <t:${Number(nextBirthday) / 1000}:R>`,
                inline: true,
            },
            {
                name: `Star Sign`,
                value: `${starSign?.name} ${starSign?.icon}`,
                inline: true,
            },
            {
                name: "Disclaimer",
                value: "All times are recorded in UTC timezone. The “next birthday” and birthday role times may be inaccurate due to this.",
            },
        ]);

        return { embeds: [embed] };
    }
};

interface dateInput {
    day: string | number;
    month: string | number;
    year: string | number;
}
