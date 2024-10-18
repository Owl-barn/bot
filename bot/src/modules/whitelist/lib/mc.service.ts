import { Database, state } from "@app";
import axios from "axios";
import { ChatInputCommandInteraction, Guild } from "discord.js";
import { Rcon } from "rcon-client/lib";
import { localState } from "..";
import { getConfig, RconGuild } from "./getConfig";

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
  login: RconGuild,
): Promise<string[]> {
  const rcon = await Rcon.connect({
    host: login.rconHost,
    port: login.rconPort,
    password: login.rconPassword,
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

  const data = {
    success: [] as string[],
    failed: [] as string[],
  };

  for (const user of users) {
    try {
      const dcUser = await msg.guild?.members.fetch(user.userId);
      const mcName = await getMcName(user.minecraftId);

      if (!mcName) throw "missing MC name";
      if (!dcUser) throw "missing DC user";
      if (dcUser.nickname == mcName) continue;

      await dcUser.setNickname(mcName);
      data.success.push(user.userId);
    } catch (error) {
      data.failed.push(user.userId);
      localState.log.warn(`Mass rename entry failed <@${user.id.cyan}`, { error });
    }
  }

  localState.log.info("Mass rename complete.", { data });
}

export async function massWhitelist(
  guild: Guild,
  db: Database,
): Promise<void> {
  const users = await db.whitelist.findMany();
  const config = await getConfig(guild.id);

  if (!config) throw "No rcon info";

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

      if (config.rconRoleId && !dcUser.roles.cache.has(config.rconRoleId)) {
        await dcUser.roles.add(config.rconRoleId);
        console.log(`Added role to ${user.userId}`.green);
      }

      commands.push(`whitelist add ${mcName}`);
    } catch (e) {
      console.error(e);
      console.log(`whitelist entry failed: ${user.userId}`.red);
    }
  }
  const whitelisted = await RCONHandler(commands, config);
  console.log(whitelisted);

  db.whitelist.deleteMany({
    where: { OR: [{ userId: { in: left } }] },
  });
}
