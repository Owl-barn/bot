import colors from "colors";
colors.enable();

import { Client } from "discord.js";
import { loadClient } from "@lib/loaders/loadClient";
import { loadEnvironment } from "@lib/loaders/loadEnvironment ";
import { Server } from "@lib/server";
import { CommandStruct } from "@structs/command";
import { loadCommands } from "@lib/loaders/loadCommands";
import { Controller } from "@lib/controller";
import { loadEvents } from "@lib/loaders/loadEvents";
import { Commands } from "commands";
import status from "commands/status";
import { runCommand } from "@lib/processCommand";
import { Logger } from "winston";
import { loadLogger } from "@lib/loaders/loadLogger";

interface State {
  env: typeof loadEnvironment;
  controller: Controller;
  server: Server;
  client: Client;
  commands: Map<string, CommandStruct<keyof Commands>>;
  logger: Logger;
}

const state = {
  env: loadEnvironment,
  commands: new Map(),
  logger: loadLogger,
} as unknown as State;

export { state };

(async () => {
  // Websocket Server
  state.server = new Server();
  const token = await state.server.connect();

  // Client
  state.client = await loadClient(token);

  await loadCommands(`${__dirname}/commands`);
  await loadEvents(`${__dirname}/events`)

  // Send initial status to server.
  state.server.broadcast("Status", await status.run({}));

  // If bot reconnects, resend guild info to server.
  state.server.on("ConnectionOpened", () => runCommand(status, { mid: "", command: "Status", data: {} }));


  // Music Player
  state.controller = new Controller();
})();
