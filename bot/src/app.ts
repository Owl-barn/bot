import { loadClient } from "@lib/loaders/loadClient";
import { LogService } from "@lib/services/logService";
import { loadModules } from "@lib/loaders/loadModules";
import { loadEnvironment } from "@lib/loaders/loadEnvironment ";
import { ThrottleService } from "@lib/services/throttleService";

import colors from "colors";
import { Client } from "discord.js";
import { Guild, PrismaClient } from "@prisma/client";

import { ButtonStruct } from "@structs/button";
import { Module } from "@structs/module";
import { CommandEnum } from "@structs/command";
import { Logger } from "winston";
import { loadLogger } from "@lib/loaders/loadLogger";
import { loadGuilds } from "@lib/loaders/loadGuilds";
import { SelectMenuStruct } from "@structs/selectMenu";
import { initializeServer } from "api/webServer";
import { CommandTree } from "@shared/src/web_api";
import Fastify, { FastifyInstance } from "fastify";

colors.enable();

export type InteractablesEnum = ButtonStruct | SelectMenuStruct;

export interface Interactables {
  buttons: Map<string, ButtonStruct>;
  selectmenus: Map<string, SelectMenuStruct>;
}

export interface State {
  db: PrismaClient;
  env: typeof import("./lib/loaders/loadEnvironment ").loadEnvironment;
  client: Client;
  webServer: FastifyInstance;

  commands: Map<string, CommandEnum<"processed">>;
  commandTree: CommandTree;
  interactables: Interactables;

  modules: Map<string, Module>;

  bannedUsers: Map<string, string>;
  guilds: Map<string, Guild>;

  botLog: LogService;
  log: Logger;

  throttle: ThrottleService;
}

const state = {
  env: loadEnvironment,
  db: new PrismaClient(),
  webServer: Fastify(),

  commands: new Map(),
  commandTree: [],
  interactables: {
    buttons: new Map(),
    selectmenus: new Map(),
  },

  modules: new Map(),
  guilds: new Map(),

} as unknown as State;

(async () => {
  loadLogger();
  await loadClient();
  await loadModules();
  await loadGuilds();
  await initializeServer();

  state.botLog = new LogService();
  state.throttle = new ThrottleService();

  // Load banned users
  state.bannedUsers = new Map();
  const bannedUsers = await state.db.user.findMany({ where: { isBanned: true } });
  for (const user of bannedUsers) {
    state.bannedUsers.set(user.id, "");
  }

  console.log(" - Loaded ".green + bannedUsers.length.toString().cyan + " banned users".green);
}
)();

export { state };
