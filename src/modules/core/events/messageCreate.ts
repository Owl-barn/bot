import registerCommand from "@lib/command.register";
import { yearsAgo } from "@lib/time";
import { state } from "@app";
import { Event } from "@structs/event";

export default Event({
  name: "messageCreate",
  once: false,

  async execute(msg) {
    if (!msg) return;
    if (msg.author.bot) return;

    const client = msg.client;

    if (msg.member?.id !== state.env.OWNER_ID) return;

    switch (msg.content) {

      case "spin*": {
        if (!msg.member?.voice.channel?.members) return;
        const members = msg.member?.voice.channel?.members
          .map((x) => (!x.user.bot ? x : undefined))
          .filter((x) => x !== undefined);

        const result = members[Math.floor(Math.random() * members.length)];

        await msg.reply(`${result!.displayName}`);
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
          await main?.delete().catch(console.error);
          await wait?.delete().catch(console.error);
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
          await registerCommand(guild);
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
        if (!msg.guild) return;
        await registerCommand(msg.guild);
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
