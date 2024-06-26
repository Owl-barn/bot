import { state } from "@app";
import { cron } from "@structs/cron";
import { getOrdinalSuffix, yearsAgo } from "@lib/time";
import { failEmbedTemplate, warningEmbedTemplate } from "@lib/embedTemplate";
import { logType } from "@lib/services/logService";
import { localState } from "..";
import { removeRoles } from "../lib/removeRoles";
import { filter } from "../lib/filter";


export default cron(
  {
    name: "BirthdayAdd",
    time: "0 0 * * *",
  },

  async () => {
    // Remove roles from users that have them.
    await removeRoles();

    let birthdays = await state.db.birthday.findMany({ include: { user: true, guild: true } });

    // Filter out birthdays that are not today.
    birthdays = birthdays.filter(filter);

    const unavailableRoles: string[] = [];
    const unavailableChannels: string[] = [];
    const processed = {
      rolesAdded: 0,
      messagesSent: 0,
    };

    for (const birthday of birthdays) {
      const guild = await state.client.guilds.fetch(birthday.guildId).catch(() => null);
      if (!guild) continue;

      // Remove role if cant use.
      const removeRoleFromDb = async () => {
        // Remove the birthday role from the database.
        await state.db.guild.update({
          where: { id: birthday.guildId },
          data: { birthdayRoleId: null },
        });

        // Make sure all future birthdays in this guild dont run this code.
        unavailableRoles.push(birthday.guildId);
      };

      // Attempt to fetch the member, if it fails return.
      const member = await guild.members.fetch(birthday.userId).catch(() => null);
      if (member === null) {
        state.botLog.push(
          warningEmbedTemplate(`Tried assigning birthday role to a user that is not in the guild. \`<@${birthday.userId}>\``),
          birthday.guildId,
          logType.BOT
        );
        return;
      }

      // Birthday role.
      const addRole = async () => {
        if (!birthday.guild.birthdayRoleId) return;
        if (unavailableRoles.includes(birthday.guildId)) return;
        // Attempt to fetch the role, if it fails remove the role from the database and return.
        const role = await guild.roles.fetch(birthday.guild.birthdayRoleId).catch(() => null);
        if (role === null) {
          // Notify the bot owner.
          state.botLog.push(
            failEmbedTemplate("Could not find birthday role, removing from birthday role from config..."),
            birthday.guildId,
            logType.BOT
          );

          return await removeRoleFromDb();
        }

        // Attempt to add the role, if it fails remove the role from the database and return.
        const roleAdded = await member.roles.add(role).catch(() => null);
        if (roleAdded === null) {
          state.botLog.push(
            warningEmbedTemplate(`Tried assigning birthday role to a user, but failed. \`<@${birthday.userId}>\` \nrole removed from config.`),
            birthday.guildId,
            logType.BOT
          );
          return await removeRoleFromDb();
        }

        // update db to reflect that the role has been added.
        await state.db.birthday.update({
          where: { userId_guildId: { userId: birthday.userId, guildId: birthday.guildId } },
          data: { hasRole: true },
        }).catch(error => {
          state.log.error(`Error updating birthday`, { error });
        });

      };

      await addRole();

      // Birthday message.
      const sendBirthdayMessage = async () => {
        if (!birthday.date) return;
        if (!birthday.guild.birthdayChannelId) return;
        if (unavailableChannels.includes(birthday.guildId)) return;

        // Attempt to fetch the channel, if it fails remove the channel from the database, notify and return.
        const channel = await guild.channels.fetch(birthday.guild.birthdayChannelId).catch(() => null);
        if (!channel || !channel.isTextBased()) {
          // Make sure all future birthdays in this guild dont run this code.
          unavailableChannels.push(birthday.guildId);
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

          return;
        }

        const age = yearsAgo(birthday.date);
        const messageSent = await channel.send(`Happy ${age}${getOrdinalSuffix(age)} birthday <@${birthday.userId}>!!!`).catch(() => null);
        if (messageSent === null) {
          state.botLog.push(
            warningEmbedTemplate(`Tried sending birthday message to a channel, but failed. \`<#${birthday.guild.birthdayChannelId}>\``),
            birthday.guildId,
            logType.BOT
          );
          unavailableChannels.push(birthday.guildId);
        }
      };

      await sendBirthdayMessage();

    }

    const data = {
      ...processed,
      birthdays: birthdays.length,
    };

    localState.log.debug("Birthday cron job finished", { data });
  },
);
