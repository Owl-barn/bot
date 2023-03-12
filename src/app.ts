import { loadClient } from "@lib/loaders/loadClient";
import { LogService } from "@lib/services/logService";
import { loadModules } from "@lib/loaders/loadModules";
import { loadEnvironment } from "@lib/loaders/loadEnvironment ";
import { ThrottleService } from "@lib/services/throttleService";

import colors from "colors";
import { Client } from "discord.js";
import { Guild, PrismaClient } from "@prisma/client";

import { Button } from "@structs/button";
import { Module } from "@structs/module";
import { CommandEnum } from "@structs/command";
import registerCommand from "@lib/command.register";

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

  let guilds = await state.db.guild.findMany();

  const unregisteredGuilds: { id: string }[] = [];

  for (const guild of state.client.guilds.cache.values()) {
    if (!guilds.find((g) => g.id === guild.id)) {
      unregisteredGuilds.push({ id: guild.id });
    }
  }

  if (unregisteredGuilds.length > 0) {
    await state.db.guild.createMany({ data: unregisteredGuilds });
    guilds = await state.db.guild.findMany();
  }

  guilds.forEach((guild) => state.guilds.set(guild.id, guild));

  if (unregisteredGuilds.length > 0) {
    for (const { id } of unregisteredGuilds) {
      const guild = await state.client.guilds.fetch(id);
      guild && await registerCommand(guild);
    }

    console.log(`🔵 Registered `.cyan.bold + guilds.length.toString().green + ` new guild${guilds.length > 1 ? "s" : ""}`.cyan.bold);
  }


  state.log = new LogService();
  state.throttle = new ThrottleService();
}
)();

export { state };
