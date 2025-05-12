import { state } from "@app";
import { Event } from "@structs/event";
import { ActionRowBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, ComponentType, Guild, Message } from "discord.js";
import { embedTemplate } from "@lib/embedTemplate";
import { localState } from "..";
import { formatGuildInfo } from "../lib/formatGuildInfo";
import { updateCollection } from "@modules/selfrole/lib/selfrole";
import registerCommands from "@lib/commandRegister";
import { getAgeInfo } from "@modules/birthday/lib/analyse";
import { yearsAgo } from "@lib/time";
import { DateTime } from "luxon";

export default Event({
  name: "messageCreate",
  once: false,

  async execute(msg) {
    if (!msg) return;
    if (msg.author.bot) return;
    if (msg.channel.isDMBased()) {
      await relayDM(msg)
        .catch(error =>
          localState.log.error(`Failed to relay DM from ${msg.author.id}`, { error })
        );
      return;
    }

    const client = msg.client;

    if (msg.member?.id !== state.env.OWNER_ID) return;
    if (!state.client.user || !msg.mentions.has(msg.client.user)) return;

    msg.content = msg.content.replace(/<@!?\d+>/g, "").trim();

    switch (msg.content) {
      case "activity": {
        if (!msg.guildId) return;

        const users = await state.db.userGuildConfig.findMany({
          where: { guildId: msg.guildId },
        });

        await msg.guild?.members.fetch();

        const list = users
          .sort((a, b) => {
            const getLatest = (user: typeof a) =>
              Math.max(
                (user.lastMessageActivity?.getTime() || 0),
                (user.lastVoiceActivity?.getTime() || 0),
                (user.lastCommandActivity?.getTime() || 0)
              );

            return getLatest(b) - getLatest(a);
          })
          .map((user) => {
            const name = msg.client.users.cache.get(user.userId)?.displayName;

            function getFormattedDate(date: Date | null) {
              if (!date) return "never";
              return DateTime.fromJSDate(date).toRelative({ style: "narrow" }) || "just now";
            }

            return [
              `Name: ${name || "??"}`,
              `ID: ${user.userId}`,
              `LastMessage: ${getFormattedDate(user.lastMessageActivity)}`,
              `LastVoice: ${getFormattedDate(user.lastVoiceActivity)}`,
              `LastCommand: ${getFormattedDate(user.lastCommandActivity)}`,
            ].join("\n");
          });

        list.unshift(
          "Disclaimer: This is not a 100% accurate list, as it only shows the activity of users who have interacted since the bot was added.\n" +
          `Total Users: ${list.length}\n` +
          `Guild: ${msg.guild?.name}\n` +
          `ID: ${msg.guildId}`
        );

        // Return list as file
        const attachment = new AttachmentBuilder(
          Buffer.from(list.join("\n\n"))
        );

        attachment.setName("activity.txt");

        await msg.reply({
          files: [attachment],
        });

        return;
      }

      // Reset cached guild configs.
      case "cache*": {
        const guilds = await state.db.guild.findMany();
        state.guilds = new Map();
        for (const guild of guilds) state.guilds.set(guild.id, guild);
        msg.reply(`reset cache for ${guilds.length} guilds.`);
        return;
      }

      // Pick random person from vc.
      case "spin*": {
        if (!msg.member?.voice.channel?.members) return;
        const members = msg.member?.voice.channel?.members
          .map((x) => (!x.user.bot ? x : undefined))
          .filter((x) => x !== undefined);

        const result = members[Math.floor(Math.random() * members.length)];

        await msg.reply(`${result?.displayName}`);
        return;
      }

      // Shut the bot down. (docker shouldnt restart it)
      case "terminate*": {
        await msg.reply("Shutting down...");
        process.exit(0);
        return;
      }

      // Restart the bot. (docker should restart it)
      case "restart*": {
        await msg.reply("Restarting...");
        process.exit(1);
        return;
      }

      // Remove all private rooms from this guild.
      case "vc*": {
        const vcs = await state.db.privateRoom.findMany({
          where: { guildId: msg.guildId as string },
        });

        for (const vc of vcs) {
          const main = await msg.guild?.channels.fetch(
            vc.mainRoomId,
          );
          const wait = await msg.guild?.channels.fetch(
            vc.waitingRoomId,
          );
          await main?.delete().catch(console.error);
          await wait?.delete().catch(console.error);
          continue;
        }

        msg.reply("Deleted private rooms.");
        return;
      }

      case "poll*": {
        const players = msg.member?.voice.channel?.members
          .map((x) => x.user)
          .filter((x) => !x.bot);

        if (!players) return;

        await msg.reply({
          poll: {
            allowMultiselect: false,
            duration: 1,
            question: { text: "Who?" },
            answers: [
              ...players.map((x) => ({ text: x.displayName, emoji: "" })).slice(0, 10),
            ],
          },
        });

        return;
      }

      // Sets slash commands for all guilds.
      case "innitall*": {
        await registerCommands();
        await msg.reply("Updated all servers' perms");
        return;
      }

      // Remove all global and guild commands.
      case "resetall*": {
        const result = await client.application?.commands.set([]);
        await msg.reply(`Deleted ${result?.size} commands`);
        return;
      }

      // Sets slash commands for this guild.
      case "innit*": {
        const start = Date.now();
        if (!msg.guild) return;
        await registerCommands(msg.guild.id);
        await msg.reply(`Updated this server's perms, took \`${Date.now() - start}ms\``);
        return;
      }

      // Remove all global and guild commands.
      case "reset*": {
        await msg.guild?.commands.set([]);
        await msg.reply("Deleted all commands for this server");
        return;
      }

      // Gets stats for global birthdays.
      case "ageAll*": {
        const birthdays = await state.db.user.findMany({
          where: { birthdate: { not: null } },
        });

        const info = getAgeInfo(birthdays);

        msg.reply(`Average: \`${info.average}\`\nMedian: \`${info.median}\`\nRange: \`${info.range.min} - ${info.range.max}\``);
        return;
      }

      // Gets stats for this guild's birthdays.
      case "age*": {
        if (!msg.guild) return;
        const birthdays = await state.db.user.findMany({
          where: { birthdate: { not: null }, UserGuildConfig: { some: { guildId: msg.guild.id, birthdayEnabled: true } } },
        });

        const info = getAgeInfo(birthdays);

        msg.reply(`Average: \`${info.average}\`\nMedian: \`${info.median}\`\nRange: \`${info.range.min} - ${info.range.max}\``);
        return;
      }

      case "birthdays*": {
        if (!msg.guild) return;
        const birthdays = await state.db.user.findMany({
          where: { birthdate: { not: null }, UserGuildConfig: { some: { guildId: msg.guild.id, birthdayEnabled: true } } },
          orderBy: { birthdate: "asc" },
        });

        const embed = embedTemplate()
          .setTitle("Birthday List")
          .setDescription(birthdays.map((birthday, i) => {
            if (!birthday.birthdate) return;
            const name = msg.client.users.cache.get(birthday.id);
            const age = yearsAgo(birthday.birthdate, birthday.timezone);
            const ageString = birthday.birthdate.toLocaleDateString("en-gb", { year: "numeric", month: "2-digit", day: "2-digit" });
            return `${i}. **${name?.displayName || birthday.id}** - ${ageString} (${age})`;
          }).join("\n"));

        if (birthdays.length > 0) {
          embed.setFooter({ text: `Total: ${birthdays.length}` });
        } else {
          embed.setDescription("No birthdays found");
        }

        await msg.reply({ embeds: [embed] });

        return;
      }

      // Updates all selfrole collections.
      case "collections*": {
        const collections = await state.db.selfroleCollection.findMany({
          include: { roles: true },
        });

        for (const collection of collections) {
          await updateCollection(collection).catch(console.error);
        }

        msg.reply(`Updated all ${collections.length} collections`);

        return;
      }

      // Leave this guild.
      case "leave*": {
        await msg.channel.send("👋").catch(() => null);
        await msg.guild?.leave();
        return;
      }

      // Toggle dev mode for this guild.
      case "dev*": {
        if (!msg.guild) return;
        const guild = await state.db.guild.findUnique({
          where: { id: msg.guild.id },
        });

        if (!guild) return;

        await state.db.guild.update({
          where: { id: msg.guild.id },
          data: { isDev: !guild.isDev },
        });

        msg.reply(`Dev mode is now ${!guild.isDev ? "on" : "off"}`);
        return;
      }

      // Leave all inactive guilds.
      case "prune*": {
        const now = new Date();
        const cutoff = new Date(now.setDate(now.getDate() - 90));

        const guildInfo = await state.db.guild.findMany({
          include: {
            _count: {
              select: {
                commandLogs: { where: { createdAt: { gt: cutoff } } },
              },
            },
            selfroleCollections: true,
          },
        });

        const leave: Guild[] = [];
        const leaveInfo = [];

        for (const guild of client.guilds.cache.values()) {
          const db = guildInfo.find((y) => y.id == guild.id);
          if (!db) continue;
          if (db._count.commandLogs > 5) continue;
          if (db.selfroleCollections.length > 0) continue;
          if (db.subscriptionTier) continue;
          if (db.levelSystemEnabled) continue;
          if (db.privateRoomChannelId) continue;

          leaveInfo.push(formatGuildInfo(guild, db));
          leave.push(guild);
        }

        if (leave.length === 0) {
          await msg.reply("No inactive guilds");
          return;
        }

        const button = new ButtonBuilder()
          .setCustomId("ConfirmPrune")
          .setLabel("Confirm")
          .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder()
          .addComponents(button) as ActionRowBuilder<ButtonBuilder>;

        const attachment = new AttachmentBuilder(
          Buffer.from(JSON.stringify(leaveInfo, null, 2))
        );
        attachment.setName("info.txt");

        const message = await msg.reply({
          content: `${leave.length} inactive guilds, leave?`,
          components: [row],
          files: [attachment],
        });

        const collector = message.createMessageComponentCollector({
          componentType: ComponentType.Button,
          time: 15000,
        });

        collector.on("collect", async (i) => {
          if (i.user.id !== state.env.OWNER_ID) return;
          await i.deferReply({ ephemeral: true });

          for (const guild of leave) {
            await guild.leave();
          }

          collector.stop();
          await i.editReply("Done");
          await i.message.delete();
        });

      }
    }

  },
});

async function relayDM(msg: Message) {
  if (!msg.content && msg.attachments.size === 0) return;
  if (msg.author.id === state.env.OWNER_ID) return;

  const user = await msg.client.users.fetch(state.env.OWNER_ID);

  const embed = embedTemplate()
    .setAuthor({ iconURL: msg.author.displayAvatarURL(), name: msg.author.tag });

  if (msg.content)
    embed.setDescription(msg.content);

  if (msg.attachments.size > 0)
    embed.addFields({ name: "Attachments", value: msg.attachments.map(x => ` - ${x.url}`).join("\n") });


  await user.send({ embeds: [embed] });
  localState.log.info(`Relayed DM from ${msg.author.tag} (${msg.author.id})`);
}
