import { GuildMember, MessageEmbed } from "discord.js";
import moment from "moment";
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

            let content = "This user has no birthday registered";

            if (query?.birthday) {
                const birthdayms = Number(new Date(query.birthday)) / 1000;
                content = `**their birthday is on** ${moment(query.birthday).format("DD-MM-YYYY")}\n**Which was** <t:${birthdayms}:R>`;
            }

            const embed = new MessageEmbed()
                .addField(`${user.displayName}'s birthday`, content)
                .setFooter(`${msg.user.username} <@${msg.user.id}>`, msg.user.displayAvatarURL())
                .setTimestamp();

            return { embeds: [embed] };


        } else if (subCommand === "set") {
            if (!birthday) throw "a";

            if (!birthdayCheck.test(birthday)) return { content: "Invalid input" };

            const birthdayMoment = moment(birthday, "DD-MM-YYYY");

            if (!birthdayMoment.isValid()) return { content: "Invalid date" };

            const query = await client.db.birthdays.create({ data: { birthday: birthdayMoment.toDate(), user_id: msg.user.id, guild_id: msg.guildId } }).catch(null);

            if (!query) {
                return { content: "You can only change your birthday once a year, dm <@!140762569056059392> if there was a mistake" };
            }

            const birthdayms = Number(new Date(query.birthday)) / 1000;

            const embed = new MessageEmbed()
                .addField(`Birthday set!`, `**your birthday has been set to** ${moment(query.birthday).format("DD-MM-YYYY")}\n
                **which was** <t:${birthdayms}:R>.\n
                The time is displayed in utc relative to your timezone so it may show up wrong`)
                .setFooter(`${msg.user.username} <@${msg.user.id}>`, msg.user.displayAvatarURL())
                .setTimestamp();

            return { embeds: [embed] };
        }

        throw "a";

    }
};