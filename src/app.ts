import { loadModules } from "@lib/loaders/loadModules";
import { LogService } from "@lib/services/logService";
import { ThrottleService } from "@lib/services/throttleService";
import { guilds, PrismaClient } from "@prisma/client";
import { Button } from "@structs/button";
import { CommandEnum } from "@structs/command";
import { Module } from "@structs/module";
import colors from "colors";
import { Client } from "discord.js";
import { loadClient } from "./lib/loaders/loadClient";
import { loadEnvironment } from "@lib/loaders/loadEnvironment ";

colors.enable();

export interface State {
  db: PrismaClient;
  env: typeof import("./lib/loaders/loadEnvironment ").loadEnvironment;
  client: Client;

  commands: Map<string, CommandEnum>;
  buttons: Map<string, Button>;

  modules: Map<string, Module>;

  bannedUsers: Map<string, string>;
  guilds: Map<string, guilds>;

  log: LogService;
  throttle: ThrottleService;
}


const state = {
  env: loadEnvironment,
  db: new PrismaClient(),

  modules: new Map(),

  log: new LogService(),
  throttle: new ThrottleService(),
} as unknown as State;

(async () => {
  await loadClient();
  await loadModules();
}
)();

export { state };
