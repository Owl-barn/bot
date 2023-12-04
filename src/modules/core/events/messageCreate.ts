import registerCommand from "@lib/command.register";
import { yearsAgo } from "@lib/time";
import { state } from "@app";
import { Event } from "@structs/event";
import { ActionRowBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, ComponentType, Guild, Message } from "discord.js";
import { embedTemplate } from "@lib/embedTemplate";
import { localState } from "..";
import { formatGuildInfo } from "../lib/formatGuildInfo";
import { updateCollection } from "@modules/selfrole/lib/selfrole";

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

    switch (msg.content) {

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

      // Remove all global and guild commands.
      case "reset*": {
        await msg.guild?.commands.set([]);
        await client.application?.commands.set([]);
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

      // Sets slash commands for all guilds.
      case "innitall*": {
        const guilds = client.guilds.cache;
        const start = Date.now();
        const message = await msg.reply("updating...");

        for (const guild of guilds.values()) {
          await registerCommand(guild);
        }

        await message.edit(
          `Updated all ${guilds.size} server perms, took \`${Date.now() - start
          }ms\``,
        );
        return;
      }

      // Sets slash commands for this guild.
      case "innit*": {
        const start = Date.now();
        if (!msg.guild) return;
        await registerCommand(msg.guild);
        msg.reply(
          `Updated this server's perms, took \`${Date.now() - start}ms\``,
        );
        return;
      }

      // Gets stats for birthdays.
      case "age*": {
        let birthdays = await state.db.birthday.findMany({
          where: { guildId: msg.guildId as string },
        });
        let combined = 0;
        const currentYear = new Date().getFullYear();

        birthdays = birthdays.filter(x => x.date && x.date.getFullYear() > currentYear - 40);

        birthdays = birthdays.sort((x, y) => Number(y.date) - Number(x.date));

        birthdays.forEach((x) => (combined += yearsAgo(x.date as Date)));

        const average = Math.round(combined / birthdays.length);

        msg.reply(
          `**Average:** ${average}\n`
          + `**Median:** ${yearsAgo(birthdays[Math.round(birthdays.length / 2)].date as Date)}\n`
          + `**Range:** ${yearsAgo(birthdays[0].date as Date)} - ${yearsAgo(birthdays[birthdays.length - 1].date as Date,)}`,
        );

        return;
      }

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
          if (db.level) continue;
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
