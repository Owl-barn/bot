import { birthdays, guilds } from "@prisma/client";
import cron from "cron";
import bot from "../app";
import RavenClient from "../types/ravenClient";

const birthdayCron = new cron.CronJob("0 0 * * *", async () => {
    await birthdayLoop();
}, null, true, "Europe/London");

export async function birthdayLoop(): Promise<void> {
    const client = bot.getClient();

    console.log("running loop");

    const users = await client.db.$queryRaw`
    select * from birthdays
    where extract(month from birthday) = extract(month from current_timestamp)
    and extract(day from birthday) = extract(day from current_timestamp)
    ` as birthdays[];

    const guildsDB = await client.db.guilds.findMany({ where: { NOT: { birthday_id: null } } });

    const removeRoleUsers = await client.db.birthdays.findMany({ where: { has_role: true } });

    for (const user of removeRoleUsers) {
        const data = await getData(user, guildsDB, client);
        if (!data) return;
        const { guild, role, member } = data;

        await client.db.birthdays.update({
            where: { user_id_guild_id: { user_id: user.user_id, guild_id: guild.id } },
            data: { has_role: false },
        }).catch(() => null);

        const addRole = await member.roles.remove(role).catch(() => null);
        if (!addRole) return;

        console.info(`removed birthday role from ${user.user_id}`.yellow);
    }

    for (const user of users) {
        const data = await getData(user, guildsDB, client);
        if (!data) return;
        const { guild, role, member } = data;

        const addRole = await member.roles.add(role).catch(() => null);
        if (!addRole) return;

        await client.db.birthdays.update({
            where: { user_id_guild_id: { user_id: user.user_id, guild_id: guild.id } },
            data: { has_role: true },
        }).catch(() => null);

        console.info(`given birthday role to ${user.user_id}`.yellow);
    }
}

async function getData(user: birthdays, guildsDB: guilds[], client: RavenClient) {
    const guildDB = guildsDB.find(x => x.guild_id === user.guild_id);
    if (!guildDB) return;
    if (guildDB.birthday_id === null) return;

    const guild = client.guilds.cache.get(guildDB.guild_id);
    if (!guild) return;

    const member = await guild?.members.fetch(user.user_id).catch(() => null);
    if (!member) return;

    const role = await guild.roles.fetch(guildDB.birthday_id).catch(() => null);
    if (!role) {
        await client.db.guilds.update({ where: { guild_id: guildDB.guild_id }, data: { birthday_id: null } }).catch(() => null);
        return;
    }

    return { guild, role, member };
}
export default birthdayCron;