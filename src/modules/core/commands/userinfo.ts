import { embedTemplate } from "@lib/embedTemplate";
import { getAvatar } from "@lib/functions";
import { state } from "@app";
import { CommandGroup } from "@structs/command";
import { Command } from "@structs/command/command";
import { ApplicationCommandOptionType, EmbedField } from "discord.js";
import moment from "moment";
import { calculateLevelFromXP } from "modules/level/lib/calculateLevelFromXP";
import { ModerationType } from "@prisma/client";

export default Command(

  // Info
  {
    name: "userinfo",
    description: "view userinfo",
    group: CommandGroup.general,

    isGlobal: true,

    arguments: [
      {
        type: ApplicationCommandOptionType.User,
        name: "user",
        description: "Who's info to get",
        required: false,
      },
      {
        type: ApplicationCommandOptionType.Boolean,
        name: "global",
        description: "Get global info",
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
    const user = msg.options.getUser("user") || msg.user;
    const member = !msg.options.getBoolean("global") ? await msg.guild?.members.fetch(user.id) : undefined;

    const guildConfig = state.guilds.get(msg.guild?.id || "");

    const userData = await state.db.user.findUnique({
      where: { id: user.id },
      select: {
        birthdays: true,

        infractions: { where: { NOT: { deletedOn: null } } },
        moderationActions: true,

        friends: { where: { isPending: false } },
        friendships: { where: { isPending: false } },

        Level: true,
      },
    });


    const roles = member?.roles.cache.sort((x, y) => y.position - x.position);

    const createdTime = Math.round(user.createdTimestamp / 1000);
    const joinedTime = member && Math.floor((member.joinedTimestamp || 0) / 1000);

    const muteTimeStamp = member?.communicationDisabledUntilTimestamp;
    const muted = (muteTimeStamp && muteTimeStamp > Date.now()) ? Math.round(muteTimeStamp / 1000) : undefined;

    const birthday = member ? userData?.birthdays.find((x) => x.guildId === member.guild.id) : userData?.birthdays[0];

    const fields: EmbedField[] = [];

    // Base Info.
    const info = [
      `**tag:** ${user}`,
      `**ID:** \`${user.id}\``,
      `**Created:** <t:${createdTime}>`,

      joinedTime &&
      `**Joined:** <t:${joinedTime}>`,

      muted &&
      `**Mute will be removed** <t:${muted})}:R>`,

      birthday &&
      `**Birthday:** ${moment(birthday.date).format("DD-MM-YYYY")}`,

      `**bot:** ${user.bot ? "yes 🤖" : "no 🦉"}`,
    ];

    fields.push({
      name: "Base Info",
      value: info.filter((x) => x).join("\n"),
      inline: false,
    });

    // Friends.
    if (userData?.friends.length || userData?.friendships.length) {
      const friends = userData.friends.length;
      const friendships = userData.friendships.length;

      fields.push({
        name: "Friends",
        value: `**Friends:** ${friends}\n **Friendships:** ${friendships}`,
        inline: true,
      });
    }

    // Level.
    if (guildConfig?.level && userData?.Level) {
      if (!member) {

        let highestXP = 0;
        userData.Level.forEach((x) => x.experience > highestXP && (highestXP = x.experience));
        const highestLevel = calculateLevelFromXP(highestXP);

        fields.push({
          name: "Level",
          value: `** Highest level:** ${highestLevel.level}\n ** XP:** ${highestLevel.totalXP}`,
          inline: true,
        });
      } else {
        const level = calculateLevelFromXP(userData.Level.find(x => x.guildId === member.guild.id)?.experience || 0);

        fields.push({
          name: "Level",
          value: `** Level:** ${level.level}\n ** XP:** ${level.totalXP}`,
          inline: true,
        });
      }
    }

    // Moderation.
    if (userData?.moderationActions.length || userData?.infractions.length) {

      let moderationActions = userData?.moderationActions;
      let infractions = userData?.infractions.filter((x) => !x.expiresOn || x.expiresOn < new Date());

      if (member) {
        moderationActions = moderationActions.filter((x) => x.guildId === member.guild.id);
        infractions = infractions.filter((x) => x.guildId === member.guild.id);
      }

      interface ModerationCount { given: number, received: number }
      const moderationCounts: { [x in ModerationType]: ModerationCount } = {
        warn: { given: 0, received: 0 },
        ban: { given: 0, received: 0 },
        kick: { given: 0, received: 0 },
        timeout: { given: 0, received: 0 },
      };

      const hasGiven = moderationActions.length > 0;

      for (const modLog of moderationActions || [])
        moderationCounts[modLog.moderationType].given++;

      for (const modLog of infractions || [])
        moderationCounts[modLog.moderationType].received++;

      const formatItem = (key: ModerationType, item: ModerationCount) => {
        return `** ${key}:** \`${item.received}\` received ${hasGiven ? `, \`${item.given}\` given` : ""}`;
      };

      const moderation = Object.entries(moderationCounts)
        .filter(([, item]) => item.received > 0 || item.given > 0)
        .map(([key, item]) => formatItem(key as ModerationType, item));

      fields.push({
        name: "Moderation",
        value: moderation.join("\n"),
        inline: false,
      });
    }

    // Roles.
    if (roles) {
      fields.push({
        name: "Roles",
        value: roles.map((x) => `${x}`).slice(0, 10).join(" ") + "\n" + (roles.size > 10 ? `...and ${roles.size - 10} more` : ""),
        inline: false,
      });
    }


    const embed = embedTemplate()
      .setTitle(`${user.username}`)
      .setDescription(`${user.username}'s ${member ? "" : "global"} user info!`)
      .setThumbnail(getAvatar(member ?? user) || null)
      .addFields(fields);

    return { embeds: [embed] };
  }
);
