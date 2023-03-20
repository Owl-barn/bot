import { state } from "@app";
import { cron } from "@structs/cron";
import { yearsAgo } from "@lib/time";
import { failEmbedTemplate, warningEmbedTemplate } from "@lib/embedTemplate";
import { logType } from "@lib/services/logService";


export default cron(
  {
    name: "BirthdayAdd",
    time: "0 0 * * *",
  },

  async () => {
    let birthdays = await state.db.birthday.findMany({ include: { user: true, guild: true } });
    const today = new Date();

    birthdays = birthdays.filter(birthday => {
      const date = birthday.date;
      if (!date) return false;
      if (!birthday.user.isBanned) return false;
      if (!birthday.guild.birthdayChannelId && !birthday.guild.birthdayRoleId) return false;
      return date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
    });

    const unavailableRoles: string[] = [];
    const unavailableChannels: string[] = [];
    const processed = {
      rolesAdded: 0,
      messagesSent: 0,
    };

    for (const birthday of birthdays) {
      const guild = await state.client.guilds.fetch(birthday.guildId).catch(() => null);
      if (!guild) continue;

      const removeRoleFromDb = async () => {
        // Remove the birthday role from the database.
        await state.db.guild.update({
          where: { id: birthday.guildId },
          data: { birthdayRoleId: null },
        });

        // Make sure all future birthdays in this guild dont run this code.
        unavailableRoles.push(birthday.guildId);
      };

      // Birthday role.
      const addRole = async () => {
        if (!birthday.guild.birthdayRoleId) return;
        if (unavailableRoles.includes(birthday.guildId)) return;
        // Attempt to fetch the role, if it fails remove the role from the database and return.
        const role = await guild.roles.fetch(birthday.guild.birthdayRoleId).catch(() => null);
        if (role === null) {
          // Notify the bot owner.
          state.log.push(
            failEmbedTemplate("Could not find birthday role, removing from birthday role from config..."),
            birthday.guildId,
            logType.BOT
          );

          return await removeRoleFromDb();
        }

        // Attempt to fetch the member, if it fails return.
        const member = await guild.members.fetch(birthday.userId).catch(() => null);
        if (member === null) {
          state.log.push(
            warningEmbedTemplate(`Tried assigning birthday role to a user that is not in the guild. \`<@${birthday.userId}>\``),
            birthday.guildId,
            logType.BOT
          );
          return;
        }

        // Attempt to add the role, if it fails remove the role from the database and return.
        const roleAdded = await member.roles.add(role).catch(() => null);
        if (roleAdded === null) {
          state.log.push(
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
        }).catch(console.error);

      };
      await addRole();

      // Birthday message.
      const sendBirthdayMessage = async () => {
        // this shouldnt be needed 🥴
        if (!birthday.date) return;
        if (!birthday.guild.birthdayChannelId) return;
        if (unavailableChannels.includes(birthday.guildId)) return;

        // Attempt to fetch the channel, if it fails remove the channel from the database, notify and return.
        const channel = await guild.channels.fetch(birthday.guild.birthdayChannelId).catch(() => null);
        if (!channel || !channel.isTextBased()) {
          // Make sure all future birthdays in this guild dont run this code.
          unavailableChannels.push(birthday.guildId);
          // Notify the bot owner.
          state.log.push(
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

        const messageSent = await channel.send(`Happy ${yearsAgo(birthday.date)}th birthday <@${birthday.userId}>!!!`).catch(() => null);
        if (messageSent === null) {
          state.log.push(
            warningEmbedTemplate(`Tried sending birthday message to a channel, but failed. \`<#${birthday.guild.birthdayChannelId}>\``),
            birthday.guildId,
            logType.BOT
          );
          unavailableChannels.push(birthday.guildId);
        }
      };
      await sendBirthdayMessage();

    }

    console.log(`
    Processed ${birthdays.length} birthdays\n
    Roles added: ${processed.rolesAdded}\n
    Messages sent: ${processed.messagesSent}
    `.cyan);

  },
);
