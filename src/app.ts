import { loadClient } from "@lib/loaders/loadClient";
import { LogService } from "@lib/services/logService";
import { loadModules } from "@lib/loaders/loadModules";
import { loadEnvironment } from "@lib/loaders/loadEnvironment ";
import { ThrottleService } from "@lib/services/throttleService";

import colors from "colors";
import { Client } from "discord.js";
import { guilds as Guild, PrismaClient } from "@prisma/client";

import { Button } from "@structs/button";
import { Module } from "@structs/module";
import { CommandEnum } from "@structs/command";

colors.enable();

export interface State {
  db: PrismaClient;
  env: typeof import("./lib/loaders/loadEnvironment ").loadEnvironment;
  client: Client;

  commands: Map<string, CommandEnum>;
  buttons: Map<string, Button>;

  modules: Map<string, Module>;

  bannedUsers: Map<string, string>;
  guilds: Map<string, Guild>;

  log: LogService;
  throttle: ThrottleService;
}

const state = {
  env: loadEnvironment,
  db: new PrismaClient(),

  commands: new Map(),
  buttons: new Map(),
  modules: new Map(),
  guilds: new Map(),

} as unknown as State;

(async () => {
  await loadClient();
  await loadModules();
  const guilds = await state.db.guilds.findMany();
  guilds.forEach((guild) => state.guilds.set(guild.guild_id, guild));

  state.log = new LogService();
  state.throttle = new ThrottleService();
}
)();

export { state };
