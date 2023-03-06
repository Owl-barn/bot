import { birthdays, guilds } from "@prisma/client";
import cron from "cron";
import { ActivityType, TextBasedChannel } from "discord.js";
import bot from "../bot";
import RavenClient from "../types/ravenClient";
import bannedUsers from "./banlist.service";
import levelService from "./level.service";

const birthdayCron = new cron.CronJob(
  "0 0 * * *",
  async () => {
    await birthdayLoop();
  },
  null,
  true,
  "UTC",
);

export async function birthdayLoop(): Promise<void> {
  const client = bot.getClient();

  levelService.clearThrottle();

  console.log("running loop");

  if (!client.user) throw "No client user???";
  const usercount = client.guilds.cache.reduce(
    (x: number, y) => x + y.memberCount,
    0,
  );
  await client.user.setActivity(`for ${usercount} members`, {
    type: ActivityType.Streaming,
    url: "https://www.youtube.com/watch?v=VZrDxD0Za9I",
  });

  const users = (await client.db.$queryRaw`
    select * from birthdays
    where extract(month from birthday) = extract(month from current_timestamp)
    and extract(day from birthday) = extract(day from current_timestamp)
    `) as birthdays[];

  const guildsDB = await client.db.guilds.findMany({
    where: {
      OR: [
        { NOT: { birthday_role: null } },
        { NOT: { birthday_channel: null } },
      ],
    },
  });

  const removeRoleUsers = await client.db.birthdays.findMany({
    where: { has_role: true },
  });

  for (const user of removeRoleUsers) {
    const data = await getData(user, guildsDB, client);
    if (!data) continue;
    const { guild, role, member } = data;

    await client.db.birthdays
      .update({
        where: {
          user_id_guild_id: {
            user_id: user.user_id,
            guild_id: guild.id,
          },
        },
        data: { has_role: false },
      })
      .catch(() => null);

    if (!role) continue;

    const addRole = await member.roles.remove(role).catch(() => null);
    if (!addRole) continue;

    console.info(`removed birthday role from ${user.user_id}`.yellow);
  }

  for (const user of users) {
    const data = await getData(user, guildsDB, client);
    if (!data) continue;
    if (bannedUsers.isBanned(user.user_id)) continue;
    const { guild, role, channel, member } = data;

    if (role) {
      const addRole = await member.roles.add(role).catch(() => null);
      if (addRole) {
        await client.db.birthdays
          .update({
            where: {
              user_id_guild_id: {
                user_id: user.user_id,
                guild_id: guild.id,
              },
            },
            data: { has_role: true },
          })
          .catch(() => null);

        console.info(`given birthday role to ${user.user_id}`.yellow);
      }
    }

    if (channel) {
      await channel
        .send(`Happy birthday <@${member.id}>!!!`)
        .catch(() => console.log("Couldnt send birthday message"));
    }
  }
}

async function getData(
  user: birthdays,
  guildsDB: guilds[],
  client: RavenClient,
) {
  const guildDB = guildsDB.find((x) => x.guild_id === user.guild_id);
  if (!guildDB) return;
  if (guildDB.birthday_role === null) return;

  const guild = client.guilds.cache.get(guildDB.guild_id);
  if (!guild) return;

  const member = await guild?.members.fetch(user.user_id).catch(() => null);
  if (!member) return;

  let role;
  if (guildDB.birthday_role) {
    role = await guild.roles.fetch(guildDB.birthday_role).catch(() => null);
    if (!role) {
      await client.db.guilds
        .update({
          where: { guild_id: guildDB.guild_id },
          data: { birthday_role: null },
        })
        .catch(() => null);
      return;
    }
  }

  let channel;
  if (guildDB.birthday_channel) {
    channel = guild.channels.cache.get(
      guildDB.birthday_channel,
    ) as TextBasedChannel;
    if (!channel) {
      await client.db.guilds
        .update({
          where: { guild_id: guildDB.guild_id },
          data: { birthday_channel: null },
        })
        .catch(() => null);
      return;
    }
  }

  return { guild, role, channel, member };
}
export default birthdayCron;
