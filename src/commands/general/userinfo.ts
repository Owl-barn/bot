import { ImageURLOptions } from "@discordjs/rest";
import {
    GuildMember,
    HexColorString,
    EmbedBuilder,
    ApplicationCommandOptionType,
} from "discord.js";
import moment from "moment";
import { Command, returnMessage } from "../../types/Command";
import { CommandGroup } from "../../types/commandGroup";
import RavenInteraction from "../../types/interaction";

module.exports = class extends Command {
    constructor() {
        super({
            name: "userinfo",
            description: "view userinfo",
            group: CommandGroup.general,

            guildOnly: true,

            args: [
                {
                    type: ApplicationCommandOptionType.User,
                    name: "user",
                    description: "Who's info to get",
                    required: false,
                },
            ],

            throttling: {
                duration: 60,
                usages: 2,
            },
        });
    }

    async execute(msg: RavenInteraction): Promise<returnMessage> {
        const settings: ImageURLOptions = { dynamic: true, size: 4096 };
        let member = msg.options.getMember("user") as GuildMember | null;
        if (member === null) member = msg.member as GuildMember;

        const avatar =
            member.avatarURL(settings) || member.user.avatarURL(settings);
        const roles = member.roles.cache.sort(
            (x, y) => y.position - x.position,
        );

        const birthdayQuery = await msg.client.db.birthdays.findUnique({
            where: {
                user_id_guild_id: {
                    user_id: member.id,
                    guild_id: msg.guildId as string,
                },
            },
        });

        const warnQuery = await msg.client.db.warnings.count({
            where: { target_id: member.id as string },
        });

        const tag = `**tag:** ${member}`;
        const id = `**ID:** \`${member.id}\``;
        const createdTime = Math.round(member.user.createdTimestamp / 1000);
        const created = `**Created:** <t:${createdTime}>`;
        const joinedTime = Math.floor((member.joinedTimestamp || 0) / 1000);
        const joined = `**Joined:** <t:${joinedTime}>`;
        const birthdayTime = moment(birthdayQuery?.birthday).format(
            "DD-MM-YYYY",
        );
        const birthday = birthdayQuery ? `**Birthday:** ${birthdayTime}` : "";
        const warnings = `**Warnings:** ${warnQuery}`;
        const bot = `${member.user.bot ? "**Bot:** ✅" : ""}`;

        let list: string | string[] = [
            tag,
            id,
            created,
            joined,
            birthday,
            warnings,
            bot,
        ];

        list = list.join("\n");

        const embed = new EmbedBuilder()
            .setTitle(`${member.user.username}`)
            .setDescription(`${member.user.username}'s user info!`)
            .setThumbnail(avatar || member.user.defaultAvatarURL)
            .addFields([
                { name: "Base info", value: list },
                { name: "Roles", value: roles.map((x) => `${x}`).join(" ") },
            ])
            .setColor(process.env.EMBED_COLOR as HexColorString);

        return { embeds: [embed] };
    }
};
