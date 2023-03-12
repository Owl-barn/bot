import { PrismaClient } from "@prisma/client";
import { state } from "@app";
import axios from "axios";
import { ChatInputCommandInteraction, Guild } from "discord.js";
import { Rcon } from "rcon-client/lib";

/**
 * Fetches the player's minecraft `UUID` from Mojang's API.
 * @param username The username of the user to lookup.
 * @returns Minecraft UUID (`string`).
 */
export async function getMcUUID(username: string): Promise<string | null> {
  let code = null;
  await axios
    .get(`https://api.mojang.com/users/profiles/minecraft/${username}`)
    .then((response) => {
      response.status == 200 ? (code = response.data.id) : null;
    });
  return code;
}

/**
 * Fetches the player's minecraft `username` from Mojang's API.
 * @param uuid The minecraft uuid of the player
 * @returns Minecraft username (`string`).
 */
export async function getMcName(id: string): Promise<string | null> {
  let userName = null;
  const url =
    "https://sessionserver.mojang.com/session/minecraft/profile/" + id;

  await axios.get(url).then((response) => {
    response.status === 200 ? (userName = response.data.name) : null;
  });

  return userName;
}

/**
 * Sends an array of commands to the rcon server.
 * @param commands Array of commands to send
 * @param login `{
 * host: string,
 * port: number,
 * password: string
 * }`
 * @returns Responses from the rcon server
 */
export async function RCONHandler(
  commands: string[],
  login: RCONLogin,
): Promise<string[]> {
  const rcon = await Rcon.connect({
    host: login.host,
    port: login.port,
    password: login.password,
  }).catch(() => false);

  if (typeof rcon == "boolean") throw "Server unreachable.";

  const response: string[] = [];

  // execute commands
  for (const command of commands) {
    response.push(await rcon.send(command));
  }

  // End connection.
  rcon.end();

  return response;
}

export async function massRename(msg: ChatInputCommandInteraction): Promise<void> {
  const users = await state.db.whitelist.findMany();

  for (const user of users) {
    try {
      const dcUser = await msg.guild?.members.fetch(user.userId);
      const mcName = await getMcName(user.minecraftId);

      if (!mcName || !dcUser) throw "missing";

      if (dcUser.nickname == mcName) continue;

      await dcUser.setNickname(mcName);

      console.log(`mass rename success: ${user.userId}`.green);
    } catch (e) {
      console.error(e);
      console.log(`mass rename entry failed: ${user.userId}`.red);
    }
  }
}

export async function massWhitelist(
  guild: Guild,
  db: PrismaClient,
): Promise<void> {
  const users = await db.whitelist.findMany();
  const rconInfo = await db.rcon.findUnique({
    where: { guildId: guild.id },
  });

  if (!rconInfo) throw "No rcon info";

  const commands: string[] = [];
  const left: string[] = [];

  for (const user of users) {
    try {
      const mcName = await getMcName(user.minecraftId);
      const dcUser = await guild.members
        .fetch(user.userId)
        .catch(() => null);

      if (!mcName) {
        console.log(`Couldnt find mc name: ${user.userId}`.red);
        continue;
      }

      if (!dcUser) {
        left.push(user.userId);
        console.log(`User left: ${user.userId}`.red);
        continue;
      }

      if (dcUser.nickname != mcName) {
        const nick = await dcUser.setNickname(mcName).catch(() => null);
        if (nick)
          console.log(
            `Nickname changed: ${mcName}  - ${dcUser.id}`.green,
          );
        else
          console.log(
            `Nickname failed: ${mcName} - ${dcUser.id}`.red,
          );
      }

      if (rconInfo.roleId && !dcUser.roles.cache.has(rconInfo.roleId)) {
        await dcUser.roles.add(rconInfo.roleId);
        console.log(`Added role to ${user.userId}`.green);
      }

      commands.push(`whitelist add ${mcName}`);
    } catch (e) {
      console.error(e);
      console.log(`whitelist entry failed: ${user.userId}`.red);
    }
  }
  const whitelisted = await RCONHandler(commands, rconInfo);
  console.log(whitelisted);

  db.whitelist.deleteMany({
    where: { OR: [{ userId: { in: left } }] },
  });
}

export type RCONLogin = {
  host: string;
  port: number;
  password: string;
};
