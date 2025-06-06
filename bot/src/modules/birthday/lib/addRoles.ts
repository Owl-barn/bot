import { state } from "@app";
import { warningEmbedTemplate, failEmbedTemplate, embedTemplate } from "@lib/embedTemplate";
import { logType } from "@lib/services/logService";
import { yearsAgo, getOrdinalSuffix } from "@lib/time";
import { localState } from "..";
import { ExpandedBirthday } from "../structs/expandedBirthday";
import { GuildMember } from "discord.js";
import { UserGuildConfig } from "@prisma/client";

export async function HandleBirthdays(birthdays: ExpandedBirthday[]) {
  const unavailableRoles: string[] = [];
  const unavailableChannels: string[] = [];
  const processed = {
    rolesAdded: 0,
    messagesSent: 0,
  };

  for (const birthday of birthdays) {
    const guild = await state.client.guilds.fetch(birthday.guildId).catch(() => null);
    if (!guild) continue;

    const member = await guild.members.fetch(birthday.userId).catch(() => null);
    if (!member) {
      state.botLog.push(
        warningEmbedTemplate(`Tried assigning birthday role to a user that is not in the guild. \`<@${birthday.userId}>\``),
        birthday.guildId,
        logType.BOT
      );
      continue;
    }

    // Try to add role.
    if (unavailableRoles.includes(birthday.guildId)) return;
    await addRole(birthday, member)
      .catch((err) => err.role && unavailableRoles.push(err.role));


    // Try to send birthday message.
    if (unavailableChannels.includes(birthday.guildId)) return;
    await sendBirthdayMessage(birthday, member)
      .catch((err) => err.channel && unavailableChannels.push(err.channel));
  }

  const data = {
    ...processed,
    birthdays: birthdays.length,
  };

  if (processed.rolesAdded > 0 || processed.messagesSent > 0) {
    localState.log.info(`Successfully processed ${birthdays.length} birthdays (${processed.rolesAdded} roles, ${processed.messagesSent} messages)`, { data });
  }
}

// Remove the birthday role from the database.
async function removeRoleFromDb(birthday: UserGuildConfig) {
  await state.db.guild.update({
    where: { id: birthday.guildId },
    data: { birthdayRoleId: null },
  });
}

// Add birthday role.
async function addRole(birthday: ExpandedBirthday, member: GuildMember) {
  if (!birthday.guild.birthdayRoleId) return;
  // Attempt to fetch the role, if it fails remove the role from the database and return.
  const role = await member.guild.roles.fetch(birthday.guild.birthdayRoleId).catch(() => null);
  if (role === null) {
    // Notify the bot owner.
    state.botLog.push(
      failEmbedTemplate("Could not find birthday role, removing from birthday role from config..."),
      birthday.guildId,
      logType.BOT
    );

    await removeRoleFromDb(birthday);
    throw { role: birthday.guild.birthdayRoleId };
  }

  // Attempt to add the role, if it fails remove the role from the database and return.
  const roleAdded = await member.roles.add(role).catch(() => null);
  if (roleAdded === null) {
    state.botLog.push(
      warningEmbedTemplate(`Tried assigning birthday role to a user, but failed. \`<@${birthday.userId}>\` \nrole removed from config.`),
      birthday.guildId,
      logType.BOT
    );
    await removeRoleFromDb(birthday);
    throw { role: birthday.guild.birthdayRoleId };
  }

  // update db to reflect that the role has been added.
  await state.db.userGuildConfig.update({
    where: { userId_guildId: { userId: birthday.userId, guildId: birthday.guildId } },
    data: { birthdayRoleGivenAt: new Date() },
  }).catch(error => {
    state.log.error(`Error updating birthday`, { error });
  });

}

// Birthday message.
async function sendBirthdayMessage(birthday: ExpandedBirthday, member: GuildMember) {
  if (!birthday.user.birthdate) return;
  if (!birthday.guild.birthdayChannelId) return;

  // Attempt to fetch the channel, if it fails remove the channel from the database, notify and return.
  const channel = await member.guild.channels.fetch(birthday.guild.birthdayChannelId).catch(() => null);
  if (!channel || !channel.isTextBased()) {
    // Notify the bot owner.
    state.botLog.push(
      failEmbedTemplate("Could not find birthday channel, removing from birthday channel from config..."),
      birthday.guildId,
      logType.BOT
    );

    // Remove the birthday channel from the database.
    await state.db.guild.update({
      where: { id: birthday.guildId },
      data: { birthdayChannelId: null },
    });

    throw { channel: birthday.guildId };
  }

  const age = yearsAgo(birthday.user.birthdate, birthday.user.timezone);

  const embed = embedTemplate()
    .setThumbnail(member.user.displayAvatarURL())
    .setTitle(`${member.user.displayName}'s Birthday!`)
    .setDescription(`Happy ${age}${getOrdinalSuffix(age)} birthday <@${member.user.id}>!!!`);

  const messageSent = await channel.send({
    content: `<@${birthday.userId}>`,
    embeds: [embed],
  }).catch(() => null);

  if (messageSent === null) {
    state.botLog.push(
      warningEmbedTemplate(`Tried sending birthday message to a channel, but failed. \`<#${birthday.guild.birthdayChannelId}>\``),
      birthday.guildId,
      logType.BOT
    );

    throw { channel: birthday.guildId };
  }
}
