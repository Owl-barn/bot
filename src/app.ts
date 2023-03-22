import colors from "colors";
colors.enable();

import { Client } from "discord.js";
import { loadClient } from "@lib/loaders/loadClient";
import { env } from "@lib/loaders/loadEnvironment ";
import { Server } from "@lib/server";
import { CommandStruct } from "@structs/command";
import { loadCommands } from "@lib/loaders/loadCommands";
import { Controller } from "@lib/controller";
import { loadEvents } from "@lib/loaders/loadEvents";
import { Commands } from "@structs/commands";
import status from "commands/status";
import { Logger } from "winston";
import { loadLogger } from "@lib/loaders/loadLogger";


interface Log {
  main: Logger;
  ws: Logger;
  queue: Logger;
  controller: Logger;
  client: Logger;
}
interface State {
  env: typeof env;
  controller: Controller;
  server: Server;
  client: Client;
  commands: Map<string, CommandStruct<keyof Commands>>;
  log: Log;
}

const state = {
  env,
  commands: new Map(),
  log: {} as Log,
} as unknown as State;

export { state };

(async () => {
  // Logger
  state.log.main = loadLogger();
  state.log.ws = state.log.main.child({ label: "ws" });
  state.log.queue = state.log.main.child({ label: "queue" });
  state.log.controller = state.log.main.child({ label: "controller" });
  state.log.client = state.log.main.child({ label: "client" });

  // Websocket Server
  state.server = new Server();

  const token = await state.server.connect();

  // Client
  state.client = await loadClient(token);

  // Music Player
  state.controller = new Controller();

  await loadCommands(`${__dirname}/commands`);
  await loadEvents(`${__dirname}/events`)

  // If bot reconnects, resend guild info to server.
  const broadcast = () => status.run({})
    .then((status) => state.server.broadcast("Status", status))
    .then(() => state.log.ws.info("Sent status to server"))
    .catch((e) => state.log.ws.error("Failed to send status to server: ", e));


  state.server.on("ConnectionOpened", broadcast);

  // Send initial status to server.
  await broadcast();
})();
