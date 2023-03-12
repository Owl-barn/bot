import { Birthday, Guild } from "@prisma/client";
import { state } from "@app";
import cron from "cron";
import { ActivityType, TextBasedChannel } from "discord.js";

const client = state.client;
const db = state.db;


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

  const users = (await db.$queryRaw`
    select * from birthdays
    where extract(month from birthday) = extract(month from current_timestamp)
    and extract(day from birthday) = extract(day from current_timestamp)
    `) as Birthday[];

  const guildsDB = await db.guild.findMany({
    where: {
      OR: [
        { NOT: { birthdayRoleId: null } },
        { NOT: { birthdayChannelId: null } },
      ],
    },
  });

  const removeRoleUsers = await db.birthday.findMany({
    where: { hasRole: true },
  });

  for (const user of removeRoleUsers) {
    const data = await getData(user, guildsDB);
    if (!data) continue;
    const { guild, role, member } = data;

    await db.birthday
      .update({
        where: {
          userId_guildId: {
            userId: user.userId,
            guildId: guild.id,
          },
        },
        data: { hasRole: false },
      })
      .catch(() => null);

    if (!role) continue;

    const addRole = await member.roles.remove(role).catch(() => null);
    if (!addRole) continue;

    console.info(`removed birthday role from ${user.userId}`.yellow);
  }

  for (const user of users) {
    const data = await getData(user, guildsDB);
    if (!data) continue;
    if (state.bannedUsers.has(user.userId)) continue;
    const { guild, role, channel, member } = data;

    if (role) {
      const addRole = await member.roles.add(role).catch(() => null);
      if (addRole) {
        await db.birthday
          .update({
            where: {
              userId_guildId: {
                userId: user.userId,
                guildId: guild.id,
              },
            },
            data: { hasRole: true },
          })
          .catch(() => null);

        console.info(`given birthday role to ${user.userId}`.yellow);
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
  user: Birthday,
  guildsDB: Guild[],
) {
  const guildDB = guildsDB.find((x) => x.id === user.guildId);
  if (!guildDB) return;
  if (guildDB.birthdayRoleId === null) return;

  const guild = client.guilds.cache.get(guildDB.id);
  if (!guild) return;

  const member = await guild?.members.fetch(user.userId).catch(() => null);
  if (!member) return;

  let role;
  if (guildDB.birthdayRoleId) {
    role = await guild.roles.fetch(guildDB.birthdayRoleId).catch(() => null);
    if (!role) {
      await db.guild
        .update({
          where: { id: guildDB.id },
          data: { birthdayRoleId: null },
        })
        .catch(() => null);
      return;
    }
  }

  let channel;
  if (guildDB.birthdayChannelId) {
    channel = guild.channels.cache.get(
      guildDB.birthdayChannelId,
    ) as TextBasedChannel;
    if (!channel) {
      await db.guild
        .update({
          where: { id: guildDB.id },
          data: { birthdayChannelId: null },
        })
        .catch(() => null);
      return;
    }
  }

  return { guild, role, channel, member };
}
export default birthdayCron;
