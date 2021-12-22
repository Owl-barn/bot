import { GuildMember, MessageEmbed } from "discord.js";
import moment from "moment";
import { nextDate, yearsAgo } from "../../lib/functions.service";
import { argumentType } from "../../types/argument";
import { Command, returnMessage } from "../../types/Command";
import RavenInteraction from "../../types/interaction";

module.exports = class extends Command {
    constructor() {
        super({
            name: "birthday",
            description: "birthday",
            group: "general",

            guildOnly: true,
            adminOnly: false,

            args: [
                {
                    type: argumentType.subCommand,
                    name: "get",
                    description: "get an user's birthday",
                    required: false,
                    subCommands: [
                        {
                            type: argumentType.user,
                            name: "user",
                            description: "Who's birthday to get",
                            required: true,
                        },
                    ],
                },
                {
                    type: argumentType.subCommand,
                    name: "set",
                    description: "set your birthday",
                    required: false,
                    subCommands: [
                        {
                            type: argumentType.string,
                            name: "birthday",
                            description: "your birthday date formatted like: dd/mm/yyyy",
                            required: true,
                        },
                    ],
                },
                {
                    type: argumentType.subCommand,
                    name: "difference",
                    description: "get an user's birthday",
                    required: false,
                    subCommands: [
                        {
                            type: argumentType.user,
                            name: "user",
                            description: "Who's birthday to compare",
                            required: true,
                        },
                        {
                            type: argumentType.user,
                            name: "second_user",
                            description: "Who's birthday to compare",
                            required: true,
                        },
                    ],
                },
                {
                    type: argumentType.subCommand,
                    name: "sync",
                    description: "fetch birthday from other server",
                    required: false,
                },
            ],

            throttling: {
                duration: 120,
                usages: 3,
            },
        });
    }

    async execute(msg: RavenInteraction): Promise<returnMessage> {

        const client = msg.client;

        const birthday = msg.options.getString("birthday");
        const user = msg.options.getMember("user") as GuildMember;
        const second_user = msg.options.getMember("second_user") as GuildMember;
        const subCommand = msg.options.getSubcommand(true);
        const birthdayCheck = new RegExp(/^[0-9]{2}[/]{1}[0-9]{2}[/]{1}[0-9]{4}$/g);

        if (subCommand === "get") {

            const query = await client.db.birthdays.findUnique({ where: { user_id_guild_id: { user_id: user.id, guild_id: msg.guildId } } });

            const embed = new MessageEmbed()
                .setTitle(`${user.user.username}'s birthday`)
                .setFooter(`${msg.user.username} <@${msg.user.id}>`, msg.user.displayAvatarURL())
                .setColor("RED")
                .setTimestamp();

            if (query?.birthday) {
                const nextBirthday = nextDate(new Date(query.birthday));
                const age = yearsAgo(query.birthday);

                embed
                    .addField(`Birth Date`, `**${user.id === msg.user.id ? `you were` : `<@!${user.id}> was`} born on** ${moment(query.birthday).format("DD-MM-YYYY")}`)
                    .addField(`info`, `**Age:** ${age} years \n**Next birthday:** <t:${Number(nextBirthday) / 1000}:R>`)
                    .addField("Disclaimer", "The time is displayed in utc relative to your timezone so it may show up wrong");
            } else {
                embed.addField(`No data`, "This user has no birthday registered");
            }

            return { embeds: [embed] };


        } else if (subCommand === "set") {
            if (!birthday) throw "no birthday!???";

            if (!birthdayCheck.test(birthday)) return { content: "Invalid input format, the format is `DD/MM/YYYY`" };

            const birthdayMoment = moment(birthday, "DD-MM-YYYY");
            if (!birthdayMoment.isValid()) return { content: "Invalid date" };

            const getBirthday = await client.db.birthdays.findUnique({ where: { user_id_guild_id: { user_id: msg.user.id, guild_id: msg.guildId } } });
            if (getBirthday && (Date.now() - Number(getBirthday.updated)) > 600000) {
                const embed = new MessageEmbed()
                    .addField("Not allowed", "You can only change your birthday once a year, dm <@140762569056059392> if there was a mistake")
                    .setFooter(`${msg.user.username} <@${msg.user.id}>`, msg.user.displayAvatarURL())
                    .setColor("RED")
                    .setTimestamp();
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

            const embed = new MessageEmbed()
                .setTitle("Birthday set!")
                .addField(`Birth Date`, `**you were born on** ${birthdayMoment.format("DD-MM-YYYY")}`)
                .addField(`info`, `**Age:** ${age} years \n**Next birthday:** <t:${Number(nextBirthday) / 1000}:R>`)
                .addField("Disclaimer", "The time is displayed in utc relative to your timezone so it may show up wrong")
                .setFooter(`${msg.user.username} <@${msg.user.id}>`, msg.user.displayAvatarURL())
                .setColor("RED")
                .setTimestamp();

            return { embeds: [embed] };
        } else if (subCommand === "difference") {
            const users = await client.db.birthdays.findMany({
                where: {
                    OR: [
                        { user_id: user.id },
                        { user_id: second_user.id },
                    ],
                    guild_id: msg.guildId,
                },
                orderBy: { birthday: "asc" },
            });

            if (users.length !== 2) return { content: "one or more of you dont have a birthday registered" };

            const difference = Math.abs((Number(users[0].birthday) - Number(users[1].birthday)) / (1000 * 60 * 60 * 24));
            const years = Math.floor(difference / 365);
            const days = difference % 365;

            const differenceString = `${years ? `${years} year${years == 1 ? "" : "s"} and` : ""} ${days} day${days == 1 ? "" : "s"}`;
            const oldest = users[0].user_id === second_user.id ? second_user : user;
            const youngest = users[1].user_id === second_user.id ? second_user : user;

            const embed = new MessageEmbed()
                .addField(`Who is older?`, `${oldest} is older than ${youngest} by ${differenceString} ${years > 2 ? `(sussy)` : ""}`)
                .setFooter(`${msg.user.username} <@${msg.user.id}>`, msg.user.displayAvatarURL())
                .setColor("RED")
                .setTimestamp();

            return { embeds: [embed] };
        } else if (subCommand === "sync") {
            const query = await client.db.birthdays.findFirst({ where: { user_id: msg.user.id } });

            if (!query) return { content: "You dont have a birthday registered anywhere else." };
            const result = await client.db.birthdays.create({ data: { user_id: query.user_id, guild_id: msg.guildId, birthday: query.birthday } }).catch(() => null);

            if (!result) return { content: "You already have a birthday registered here" };

            return { content: "birthday has been transferred!" };
        }

        throw "no subcommand!??";

    }
};