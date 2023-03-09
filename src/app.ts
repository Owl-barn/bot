import { loadModules } from "@lib/loaders/loadModules";
import { LogService } from "@lib/logService";
import { ThrottleService } from "@lib/throttleService";
import { PrismaClient } from "@prisma/client";
import { Button } from "@structs/button";
import { CommandEnum } from "@structs/command";
import { Module } from "@structs/module";
import colors from "colors";
import { Client } from "discord.js";
import { loadClient } from "./bot";
import { env } from "./lib/env";

colors.enable();

export interface State {
  db: PrismaClient;
  env: typeof import("./lib/env").env;
  client: Client;

  commands: Map<string, CommandEnum>;
  buttons: Map<string, Button>;

  modules: Map<string, Module>;

  bannedUsers: Map<string, string>;
  guilds: Map<string, string>;

  log: LogService;
  throttle: ThrottleService;
}


const state = {
  env,
  db: new PrismaClient(),

  modules: new Map(),

  LogService: new LogService(),
  throttle: new ThrottleService(),
} as unknown as State;

(async () => {
  await loadClient();
  await loadModules();
}
)();

export { state };
