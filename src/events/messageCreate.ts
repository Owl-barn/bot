import { state } from "@src/app";
import { Event } from "@src/structs/event";
import { Guild } from "discord.js";
import AFKService from "../lib/afk.service";
import bannedUsers from "../lib/banlist.service";
import { yearsAgo } from "../lib/functions";
import GuildConfig from "../lib/guildconfig.service";
import levelService from "../lib/level.service";
import { massWhitelist } from "../lib/mc.service";
import registerCommand from "../modules/command.register";

export default Event({
  name: "messageCreate",
  once: false,

  async execute(msg) {
    if (!msg) return;
    if (msg.author.bot) return;
    if (msg.guildId && GuildConfig.getGuild(msg.guildId)?.banned) return;
    if (bannedUsers.isBanned(msg.author.id)) return;

    const client = msg.client;

    levelService.message(msg).catch(console.error);
    AFKService.onMessage(msg).catch(console.error);

    if (msg.member?.id !== state.env.OWNER_ID) return;

    switch (msg.content) {

      case "masswhitelist*": {
        await massWhitelist(msg.guild as Guild, state.db);
        msg.reply("Mass whitelisted!");
        return;
      }

      case "spin*": {
        if (!msg.member?.voice.channel?.members) return;
        const members = msg.member?.voice.channel?.members
          .map((x) => (!x.user.bot ? x : undefined))
          .filter((x) => x !== undefined);

        const result = members[Math.floor(Math.random() * members.length)];

        await msg.reply(`${result!.displayName}`);
        return;
      }

      case "chaos*": {
        await state.musicService.broadcast({
          command: "Play",
          mid: msg.id,
          data: {
            query: "Funkytown",
            guildId: msg.guild?.id,
            channelId: msg.member?.voice.channelId,
            userId: msg.member?.id,
            force: true,
          },
        });

        return;
      }

      case "reset*": {
        await msg.guild?.commands.set([]);
        await client.application?.commands.set([]);
        return;
      }

      case "vc*": {
        const vcs = await state.db.private_vc.findMany({
          where: { guild_id: msg.guildId as string },
        });

        for (const vc of vcs) {
          const main = await msg.guild?.channels.fetch(
            vc.main_channel_id,
          );
          const wait = await msg.guild?.channels.fetch(
            vc.wait_channel_id,
          );
          await main?.delete().catch((x) => console.log(x));
          await wait?.delete().catch((x) => console.log(x));
          continue;
        }

        msg.reply("Deleted private roomsm.");
        return;
      }

      case "update*": {
        const guilds = client.guilds.cache;
        const start = Date.now();
        const message = await msg.reply("updating...");

        for (const guild of guilds.values()) {
          await registerCommand(client, guild);
        }

        await message.edit(
          `Updated all ${guilds.size} server perms, took \`${Date.now() - start
          }ms\``,
        );
        return;
      }

      case "fix*": {
        const data = msg.client.guilds.cache.map(guild => ({ guild_id: guild.id }));

        const result = await state.db.guilds.createMany({
          data,
          skipDuplicates: true,
        });

        msg.reply(`Fixed ${result.count} guilds.`);
        return;
      }

      case "innit*": {
        const start = Date.now();
        await registerCommand(client, msg.guild as Guild);
        msg.reply(
          `Updated this server's perms, took \`${Date.now() - start}ms\``,
        );
        return;
      }

      case "age*": {
        let birthdays = await state.db.birthdays.findMany({
          where: { guild_id: msg.guildId as string },
        });
        let combined = 0;
        const currentYear = new Date().getFullYear();

        birthdays = birthdays.filter(x => x.birthday && x.birthday.getFullYear() > currentYear - 40);

        birthdays = birthdays.sort((x, y) => Number(y.birthday) - Number(x.birthday));

        birthdays.forEach((x) => (combined += yearsAgo(x.birthday as Date)));

        const average = Math.round(combined / birthdays.length);

        msg.reply(
          `Average: ${average}`
          + `Median: ${yearsAgo(birthdays[Math.round(birthdays.length / 2)].birthday as Date)}`
          + `Range: ${yearsAgo(birthdays[0].birthday as Date)} - ${yearsAgo(birthdays[birthdays.length - 1].birthday as Date,)}`,
        );

        return;
      }
    }

  },
});
