import { embedTemplate } from "@lib/embedTemplate";
import { getAvatar } from "@lib/functions";
import { state } from "@app";
import { CommandGroup } from "@structs/command";
import { Command } from "@structs/command/command";
import { GuildMember, ApplicationCommandOptionType } from "discord.js";
import moment from "moment";

export default Command(

  // Info
  {
    name: "userinfo",
    description: "view userinfo",
    group: CommandGroup.general,

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
  },

  // Execute
  async (msg) => {
    let member = msg.options.getMember("user") as GuildMember | null;
    if (member === null) member = msg.member as GuildMember;

    const roles = member.roles.cache.sort(
      (x, y) => y.position - x.position,
    );

    const birthdayQuery = await state.db.birthday.findUnique({
      where: {
        userId_guildId: {
          userId: member.id,
          guildId: msg.guildId as string,
        },
      },
    });

    const moderationLogQuery = await state.db.infraction.groupBy({
      by: ["moderationType"],
      _count: true,
      where: {
        guildId: msg.guildId as string,
        userId: member.id,
      },
    });

    const moderationCounts = {
      warns: 0,
      bans: 0,
      kicks: 0,
      timeouts: 0,
    };

    for (const modLog of moderationLogQuery) {
      if (modLog.moderationType == "warn")
        moderationCounts.warns = modLog._count;
      else if (modLog.moderationType == "ban")
        moderationCounts.bans = modLog._count;
      else if (modLog.moderationType == "kick")
        moderationCounts.kicks = modLog._count;
      else if (modLog.moderationType == "timeout")
        moderationCounts.timeouts = modLog._count;
    }

    const tag = `**tag:** ${member}`;
    const id = `**ID:** \`${member.id}\``;
    const createdTime = Math.round(member.user.createdTimestamp / 1000);
    const created = `**Created:** <t:${createdTime}>`;
    const joinedTime = Math.floor((member.joinedTimestamp || 0) / 1000);
    const joined = `**Joined:** <t:${joinedTime}>`;
    const birthdayTime = moment(birthdayQuery?.date).format(
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

    const embed = embedTemplate()
      .setTitle(`${member.user.username}`)
      .setDescription(`${member.user.username}'s user info!`)
      .setThumbnail(getAvatar(member) || null)
      .addFields([
        { name: "Base info", value: list },
        { name: "Roles", value: roles.map((x) => `${x}`).join(" ") },
      ]);

    return { embeds: [embed] };
  }
);
