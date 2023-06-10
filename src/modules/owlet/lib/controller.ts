import { Snowflake } from "discord.js";
import { Owlet } from "./owlet";
import WS from "ws";
import fs from "fs";
import { IncomingMessage } from "http";
import path from "path";
import { QueueEvent } from "../structs/queue";
import { Credentials, baseMessage, Authenticate, Status } from "../structs/websocket";
import { state } from "@app";
import { Guild } from "../structs/commands/status";
import { localState } from "..";
import { songStart } from "../owletevent/songStart";
import { songEnd } from "../owletevent/songEnd";
import { shutdown } from "../owletevent/shutdown";

export default class Controller {
  private bots: Map<string, Owlet> = new Map();
  private wss: WS.Server;
  private credentials: Credentials[] = [];

  constructor() {
    this.wss = new WS.Server({ port: state.env.OWLET_PORT });
    this.wss.on("connection", this.onConnection);

    // Try to load the owlets from the file.
    this.loadCredentials();

    // Add main bot to the credentials.
    if (!state.client.user) throw "Client user is not defined.";
    this.credentials.unshift({
      id: state.client.user.id,
      token: state.env.DISCORD_TOKEN,
    });

    console.log(
      " - Loaded Owlet service with ".green +
      this.credentials.length.toString().cyan +
      " owlets on port ".green +
      state.env.OWLET_PORT.toString().cyan,
    );
  }

  private loadCredentials = async () => {
    // Load the credentials from the file.
    let buffer;
    try {
      buffer = fs.readFileSync(path.join(process.cwd(), "config", "owlets.json"), "utf8");
    } catch (error) {
      localState.log.warn("Failed to find/open credentials", { error });
      return;
    }

    // Parse the credentials.
    let credentials: Credentials[];
    try {
      credentials = JSON.parse(buffer.toString());
    } catch (error) {
      localState.log.error("Failed to parse credentials", { error });
      return;
    }

    // Check if the credentials are valid.
    if (!Array.isArray(credentials)) {
      localState.log.error("Credentials are not an array");
      return;
    }

    for (const credential of credentials) {
      if (!credential.id || !credential.token) {
        localState.log.error("Invalid credential", { credential });
        return;
      }
    }

    // Set the credentials.
    this.credentials = credentials;
    localState.log.debug(`Loaded ${String(credentials.length).cyan} credentials`);
  };

  private onConnection = (socket: WS, _request: IncomingMessage): void => {
    socket.on("message", (x) => this.onMessage(socket, x));
  };

  private onMessage = async (ws: WS, data: WS.Data): Promise<void> => {
    let message;

    try {
      message = JSON.parse(data.toString());
    } catch (e) {
      localState.log.error("Failed to parse message", { data });
      return;
    }

    switch (message.command) {
      case "Authenticate":
        this.authenticate(ws, message);
        break;
      case "Status":
        this.status(ws, message);
        break;
    }
  };

  public getBotIds = (): Snowflake[] => {
    return this.credentials.map((owlet) => owlet.id);
  };

  /**
     * broadcasts a message to all owlets.
     * @param data message to send
     */
  public broadcast = (data: baseMessage<Record<string, unknown>>) => {
    this.wss.clients.forEach((ws) => ws.send(JSON.stringify(data)));
  };

  /**
     * Terminates all connected owlets.
     * @returns Terminated owlet count.
     */
  public terminate = (now: boolean): number => {
    const request = {
      command: "Terminate",
      mid: "massTerminate",
      data: { now },
    };

    const botCount = this.bots.size;

    this.broadcast(request);

    return botCount;
  };

  /**
     * Returns the first unused bot account.
     * @returns Owlet credentials.
     */
  private getCredentials = () => {
    const credentialList = this.credentials;
    for (const credential of credentialList) {
      if (this.bots.has(credential.id)) continue;
      return credential;
    }
    return undefined;
  };

  private removeBot = (id: string) => {
    this.bots.delete(id);
    localState.log.info(`Owlet disconnected <@${id.cyan}>, ${String(this.bots.size).cyan} active.`);
  };

  private addBot = (id: string, ws: WS, guilds: Guild[]) => {
    const owlet = new Owlet(id, ws, guilds);

    owlet.on(QueueEvent.SongStart, data => songStart({ ...data, owletId: id }));
    owlet.on(QueueEvent.SongEnd, data => songEnd({ ...data, owletId: id }));
    owlet.on(QueueEvent.Shutdown, data => shutdown({ ...data, owletId: id }));

    // If the bot disconnects remove it from the list.
    ws.on("close", () => this.removeBot(id));

    this.bots.set(id, owlet);
  };

  private authenticate = async (ws: WS, message: baseMessage<Authenticate>) => {
    const pass = message.data.password;
    localState.log.debug(`Received auth request<${message.mid.cyan}>`);

    // Check password.
    if (pass != state.env.OWLET_PASSWORD) {
      return ws.send(
        JSON.stringify({
          mid: message.mid,
          data: { error: "incorrect password" },
        }),
      );
    }

    // Check if bot is reconnecting.
    const botToken = message.data.token;
    if (botToken) {
      const owletInfo = this.credentials.find((x) => x.token == botToken);

      // Bot account not in list.
      if (!owletInfo) {
        return ws.send(
          JSON.stringify({
            mid: message.mid,
            data: { error: "No bot account with that id in the system." },
          }),
        );
      }

      // Bot account already active.
      if (this.bots.get(owletInfo.id)) {
        return ws.send(
          JSON.stringify({
            mid: message.mid,
            data: { error: "bot account already in use" },
          }),
        );
      }

      // return success.
      const response = {
        command: "Authenticate",
        mid: message.mid,
        data: {
          token: owletInfo.token,
        },
      };

      this.addBot(owletInfo.id, ws, []);
      localState.log.info(`Re-Authenticated Owlet <@${owletInfo.id.cyan}> on request<${message.mid.cyan}>, ${String(this.bots.size).cyan} active`);

      ws.send(JSON.stringify(response));
    } else {
      // Get credentials.
      const credentials = this.getCredentials();

      if (!credentials) {
        return ws.send(
          JSON.stringify({
            mid: message.mid,
            data: { error: "No bot accounts left" },
          }),
        );
      }

      // return success.
      const response = {
        command: "Authenticate",
        mid: message.mid,
        data: {
          token: credentials.token,
        },
      };

      this.addBot(credentials.id, ws, []);
      localState.log.info(`Authenticated Owlet <@${credentials.id.cyan}> on request<${message.mid.cyan}>, ${String(this.bots.size).cyan} active`);

      ws.send(JSON.stringify(response));
    }
  };

  /**
     * Updates the current status of the owlet.
     * @param ws websocket
     * @param msg message
     * @returns nothing
     */
  private status = async (ws: WS, msg: baseMessage<Status>) => {
    const bot = this.bots.get(msg.data.id ?? "");

    if (!bot) {
      return ws.send(
        JSON.stringify({
          mid: msg.mid,
          data: { error: "bot not found" },
        }),
      );
    }

    bot.updateGuilds(msg.data.guilds);
  };

  public getOwlets = (): Map<string, Owlet> => this.bots;
  public getOwletById = (botId: string) => this.bots.get(botId);

  /**
     * Returns the Owlet currently connected to that channel or an available one
     * otherwise undefined
     */
  public getOwlet = (
    channelId: Snowflake,
    guildId: Snowflake,
  ): Owlet | undefined => {
    // search for a bot in that channel
    for (const bot of this.bots.values()) {
      for (const guild of bot.getGuilds().values()) {
        if (guild.channelId === channelId) {
          return bot;
        }
      }
    }

    // Check if main bot is available.
    if (state.client.user) {
      const main = this.bots.get(state.client.user.id)?.getGuilds().get(guildId);

      if (main && !main.channelId) return this.bots.get(state.client.user.id);
    }

    // Otherwise search for an available owlet in that guild.
    for (const bot of this.bots.values()) {
      for (const guild of bot.getGuilds().values()) {
        if (guild.id === guildId && !guild.channelId) {
          return bot;
        }
      }
    }

    // return undefined if no bot is available.
    return undefined;
  };
}
