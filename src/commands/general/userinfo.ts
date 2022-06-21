import {
    GuildMember,
    HexColorString,
    EmbedBuilder,
    ApplicationCommandOptionType,
} from "discord.js";
import moment from "moment";
import { getAvatar } from "../../lib/functions";
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

            arguments: [
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
        let member = msg.options.getMember("user") as GuildMember | null;
        if (member === null) member = msg.member as GuildMember;

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

        const moderationLogQuery = await msg.client.db.moderation_log.groupBy({
            by: ["moderation_type"],
            _count: true,
            where: {
                guild_id: msg.guildId as string,
                user: member.id,
            },
        });

        const moderationCounts = {
            warns: 0,
            bans: 0,
            kicks: 0,
            timeouts: 0,
        };

        for (const modLog of moderationLogQuery) {
            if (modLog.moderation_type == "warn")
                moderationCounts.warns = modLog._count;
            else if (modLog.moderation_type == "ban")
                moderationCounts.bans = modLog._count;
            else if (modLog.moderation_type == "kick")
                moderationCounts.kicks = modLog._count;
            else if (modLog.moderation_type == "timeout")
                moderationCounts.timeouts = modLog._count;
        }

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

        const warnings = moderationCounts.warns
            ? `**Warnings:** ${moderationCounts.warns}`
            : null;

        const bans = moderationCounts.bans
            ? `**Bans:** ${moderationCounts.bans}`
            : null;

        const kicks = moderationCounts.kicks
            ? `**Kicks:** ${moderationCounts.kicks}`
            : null;

        const timeouts = moderationCounts.timeouts
            ? `**Timeouts:** ${moderationCounts.timeouts}`
            : null;

        const muteTimeStamp = member.communicationDisabledUntilTimestamp;
        const muted =
            muteTimeStamp && muteTimeStamp > Date.now()
                ? `**Mute will be removed** <t:${Math.round(
                      muteTimeStamp / 1000,
                  )}:R>`
                : null;

        const bot = `${member.user.bot ? "**Bot:** ✅" : ""}`;

        let list: string | string[] = [tag, id, created, joined];
        if (birthday) list.push(birthday);
        if (warnings) list.push(warnings);
        if (bans) list.push(bans);
        if (kicks) list.push(kicks);
        if (timeouts) list.push(timeouts);
        if (muted) list.push(muted);
        if (bot) list.push(bot);

        list = list.join("\n");

        const embed = new EmbedBuilder()
            .setTitle(`${member.user.username}`)
            .setDescription(`${member.user.username}'s user info!`)
            .setThumbnail(getAvatar(member) || null)
            .addFields([
                { name: "Base info", value: list },
                { name: "Roles", value: roles.map((x) => `${x}`).join(" ") },
            ])
            .setColor(process.env.EMBED_COLOR as HexColorString);

        return { embeds: [embed] };
    }
};
