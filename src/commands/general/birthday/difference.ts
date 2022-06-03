import { GuildMember, ApplicationCommandOptionType } from "discord.js";
import { embedTemplate, failEmbedTemplate } from "../../../lib/embedTemplate";
import { returnMessage, SubCommand } from "../../../types/Command";
import RavenInteraction from "../../../types/interaction";

module.exports = class extends SubCommand {
    constructor() {
        super({
            name: "difference",
            description:
                "get the difference between your birthday and another user's",

            arguments: [
                {
                    type: ApplicationCommandOptionType.User,
                    name: "first_user",
                    description: "Who's birthday to compare",
                    required: true,
                },
                {
                    type: ApplicationCommandOptionType.User,
                    name: "second_user",
                    description: "Who's birthday to compare",
                    required: false,
                },
            ],

            throttling: {
                duration: 60,
                usages: 3,
            },
        });
    }

    async execute(msg: RavenInteraction): Promise<returnMessage> {
        const client = msg.client;
        if (!msg.guildId) throw "No guildID???";

        const first_user = msg.options.getMember(
            "first_user",
        ) as GuildMember | null;

        if (first_user === null) throw "No first user?";
        let second_user = msg.options.getMember("second_user") as
            | GuildMember
            | undefined;

        const embed = embedTemplate();
        const failEmbed = failEmbedTemplate();

        if (!second_user) second_user = msg.member as GuildMember;

        const users = await client.db.birthdays.findMany({
            where: {
                OR: [{ user_id: first_user.id }, { user_id: second_user.id }],
                guild_id: msg.guildId,
                NOT: { birthday: null },
            },
            orderBy: { birthday: "asc" },
        });

        if (users.length !== 2) {
            const response = failEmbed.setDescription(
                "One or more of you don't have a birthday registered.",
            );
            return { embeds: [response] };
        }

        const user0_age = Number(new Date()) - Number(users[0].birthday);
        const user1_age = Number(new Date()) - Number(users[1].birthday);

        const percent_difference =
            (Math.abs(user0_age - user1_age) /
                Math.max(user0_age + user1_age, 0.0001)) *
            2;

        const difference = Math.abs(
            (Number(users[0].birthday) - Number(users[1].birthday)) /
                (1000 * 60 * 60 * 24),
        );

        const years = Math.floor(difference / 365);
        const days = difference % 365;

        const yearString = years ? `${years} year${years == 1 ? "" : "s"}` : "";
        const dayString = `${days} day${days == 1 ? "" : "s"}`;
        const differenceString = `${yearString} and ${dayString}`;

        const oldest =
            users[0].user_id === second_user.id ? second_user : first_user;

        const youngest =
            users[1].user_id === second_user.id ? second_user : first_user;

        embed.addFields([
            {
                name: `Who is older?`,
                value: `${oldest} is older than ${youngest} by ${differenceString} ${
                    percent_difference > 0.15 ? `(sussy)` : ""
                }`,
            },
        ]);

        return { embeds: [embed] };
    }
};
