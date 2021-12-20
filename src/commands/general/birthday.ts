import { GuildMember, MessageEmbed } from "discord.js";
import moment from "moment";
import { nextDate } from "../../lib/functions.service";
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
                    subCommand: {
                        type: argumentType.user,
                        name: "user",
                        description: "Who's birthday to get",
                        required: true,
                    },
                },
                {
                    type: argumentType.subCommand,
                    name: "set",
                    description: "set your birthday",
                    required: false,
                    subCommand: {
                        type: argumentType.string,
                        name: "birthday",
                        description: "your birthday date formatted like: dd/mm/yyyy",
                        required: true,
                    },
                },
            ],

            throttling: {
                duration: 60,
                usages: 2,
            },
        });
    }

    async execute(msg: RavenInteraction): Promise<returnMessage> {

        const client = msg.client;

        const birthday = msg.options.getString("birthday");
        const user = msg.options.getMember("user") as GuildMember;
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

                const birthdayms = Number(new Date(query.birthday)) / 1000;
                embed
                    .addField(`Birth Date`, `**<@!${user.id}> was born on** ${moment(query.birthday).format("DD-MM-YYYY")}`)
                    .addField(`When?`, `**Born:** <t:${birthdayms}:R> \n**Next birthday:** <t:${Number(nextBirthday) / 1000}:R>`)
                    .addField("Disclaimer", "The time is displayed in utc relative to your timezone so it may show up wrong");
            } else {
                embed.addField(`No data`, "This user has no birthday registered");
            }

            return { embeds: [embed] };


        } else if (subCommand === "set") {
            if (!birthday) throw "a";

            if (!birthdayCheck.test(birthday)) return { content: "Invalid input" };

            const birthdayMoment = moment(birthday, "DD-MM-YYYY");

            if (!birthdayMoment.isValid()) return { content: "Invalid date" };

            const getBirthday = await client.db.birthdays.findUnique({ where: { user_id_guild_id: { user_id: msg.user.id, guild_id: msg.guildId } } });

            if (getBirthday && (Date.now() - Number(getBirthday.updated)) > 600000) {
                return { content: "You can only change your birthday once a year, dm <@!140762569056059392> if there was a mistake" };
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


            const birthdayms = Number(new Date(query.birthday)) / 1000;
            const nextBirthday = nextDate(query.birthday);

            const embed = new MessageEmbed()
                .setTitle("Birthday set!")
                .addField(`Birth Date`, `**Your birthday is on** ${birthdayMoment.format("DD-MM-YYYY")}`)
                .addField(`When?`, `**Born:** <t:${birthdayms}:R> \n**Next birthday:** <t:${Number(nextBirthday) / 1000}:R>`)
                .addField("Disclaimer", "The time is displayed in utc relative to your timezone so it may show up wrong")
                .setFooter(`${msg.user.username} <@${msg.user.id}>`, msg.user.displayAvatarURL())
                .setColor("RED")
                .setTimestamp();

            return { embeds: [embed] };
        }

        throw "a";

    }
};