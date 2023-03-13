import { ChannelType, Snowflake } from "discord.js";
import Owlet from "./owlet";
import WS from "ws";
import fs from "fs";
import { IncomingMessage } from "http";
import path from "path";
import { embedTemplate, failEmbedTemplate } from "@lib/embedTemplate";
import { getAvatar } from "@lib/functions";
import { QueueEvent } from "../structs/queue";
import { Credentials, wsResponse } from "../structs/websocket";
import { state } from "@app";

export default class Controller {
  private bots: Map<string, Owlet> = new Map();
  private wss: WS.Server;
  private owlets: Credentials[] = [];

  constructor() {
    this.wss = new WS.Server({ port: state.env.OWLET_PORT });
    this.wss.on("connection", this.onConnection);

    // Try to load the owlets from the file.
    try {
      const buffer = fs.readFileSync(
        path.join(__dirname, "../data/owlets.json"),
        "utf8",
      );

      const owletJson = JSON.parse(buffer.toString()) as
        | Credentials[]
        | undefined;

      if (!owletJson) throw "No owlets found.";
      this.owlets = owletJson;
    } catch (e) {
      if (typeof e === "string") console.error(e.yellow.bold);
      else console.error(" ✘ No owlets.json found.".yellow.bold);
    }

    if (!state.client.user) throw "Client user is not defined.";
    // Add main bot to the owlet list.
    this.owlets.unshift({
      id: state.client.user.id,
      token: state.env.DISCORD_TOKEN,
    });

    console.log(
      " - Loaded Owlet service with ".green +
      this.owlets.length.toString().cyan +
      " owlets on port ".green +
      state.env.OWLET_PORT.toString().cyan,
    );
  }

  private onConnection = (socket: WS, _request: IncomingMessage): void => {
    socket.on("message", (x) => this.onMessage(socket, x));
  };

  private onMessage = async (ws: WS, data: WS.Data): Promise<void> => {
    let message;

    try {
      message = JSON.parse(data.toString());
    } catch (e) {
      return;
    }

    if (state.env.isDevelopment) console.log("Received:".yellow.bold, message);

    switch (message.command) {
      case "Authenticate":
        this.authenticate(ws, message);
        break;
      case "Status":
        this.status(ws, message);
        break;
    }
  };

  /**
     * Returns all the registered owlet ids, connected or not
     * @returns Array of owlet user ids.
     */
  public getBotIds = (): Snowflake[] => {
    return this.owlets.map((owlet) => owlet.id);
  }

  /**
     * broadcasts a message to all owlets.
     * @param data message to send
     */
  public broadcast = (data: apiRequest) => {
    this.wss.clients.forEach((ws) => ws.send(JSON.stringify(data)));
  }

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
  }

  /**
     * Returns the first unused bot account.
     * @returns Owlet credentials.
     */
  private getCredentials = () => {
    const credentialList = this.owlets;
    for (const credential of credentialList) {
      if (this.bots.has(credential.id)) continue;
      return credential;
    }
    return undefined;
  }

  /**
     * Remove the bot from the list.
     * @param id bot id.
     */
  private removeBot = (id: string) => {
    console.log(`- Removing bot <@${id}> from the list.`.yellow.bold);

    this.bots.delete(id);
    console.log(
      `- Owlet disconnected <@${id}>, ${this.bots.size} active.`.red.bold,
    );
  }

  private addBot = (id: string, ws: WS, guilds: Guild[]) => {
    const owlet = new Owlet(id, ws, guilds);

    owlet.on(QueueEvent.SongStart, async (track, channelId, guildId) => {
      const guild = state.client.guilds.cache.get(guildId);
      if (!guild) return;
      const channel = await state.client.channels.fetch(channelId);
      if (!channel) return;
      const bot = await guild?.members.fetch(id);
      if (!bot) return;

      if (channel.type !== ChannelType.GuildVoice) return;
      const embed = embedTemplate();

      embed.setAuthor({
        iconURL: getAvatar(bot),
        name: "Now playing",
      });

      embed.setThumbnail(track.thumbnail);

      embed.addFields([
        {
          name: "Title",
          value: `[${track.title}](${track.url})`,
          inline: true,
        },
        {
          name: "Duration",
          value: track.duration,
          inline: true,
        },
      ]);

      await channel.send({ embeds: [embed] }).catch(() => {
        console.log(
          `Failed to send song start embed in <#${channel.id}>.`.red
            .italic,
        );
      });
    });

    owlet.on(QueueEvent.Shutdown, async (guildId, channelId) => {
      const guild = state.client.guilds.cache.get(guildId);
      if (!guild) return;
      const channel = await state.client.channels.fetch(channelId);
      if (!channel) return;
      if (channel.type !== ChannelType.GuildVoice) return;
      const bot = await guild?.members.fetch(id);
      if (!bot) return;

      const embed = failEmbedTemplate();

      embed.setAuthor({
        iconURL: getAvatar(bot),
        name: "Maintenance",
      });

      embed.setDescription(
        "There is currently bot maintenance going on, This music bot will restart after the song or after 10 minutes",
      );

      await channel.send({ embeds: [embed] }).catch(() => {
        console.log(
          `Failed to send shutdown embed in <#${channel.id}>.`.red
            .italic,
        );
      });
    });

    // If the bot disconnects remove it from the list.
    ws.on("close", () => this.removeBot(id));
    this.bots.set(id, owlet);


    console.log(
      `+ Owlet connected <@${id}>, ${this.bots.size} active.`.green
        .italic,
    );
  }
  /**
     * Authenticates the owlet.
     */
  private authenticate = async (ws: WS, message: apiRequest) => {
    const pass = message.data.password;

    // Check password.
    if (pass != state.env.OWLET_PASSWORD) {
      return ws.send(
        JSON.stringify({
          mid: message.mid,
          error: "incorrect password",
        }),
      );
    }

    // Check if bot is reconnecting.
    const botToken = message.data.token as string | undefined;
    if (botToken) {
      const owletInfo = this.owlets.find((x) => x.token == botToken);

      // Bot account not in list.
      if (!owletInfo) {
        return ws.send(
          JSON.stringify({
            mid: message.mid,
            error: "No bot account with that id in the system.",
          }),
        );
      }

      // Bot account already active.
      if (this.bots.get(owletInfo.id)) {
        return ws.send(
          JSON.stringify({
            mid: message.mid,
            error: "bot account already in use",
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

      ws.send(JSON.stringify(response));
    } else {
      // Get credentials.
      const credentials = await this.getCredentials();

      if (!credentials) {
        return ws.send(
          JSON.stringify({
            mid: message.mid,
            error: "No bot accounts left",
          }),
        );
      }

      // return success.
      const response = {
        command: "Authenticate",
        mid: message.mid,
        token: credentials.token,
      };

      this.addBot(credentials.id, ws, []);

      ws.send(JSON.stringify(response));
    }
  }

  /**
     * Updates the current status of the owlet.
     * @param ws websocket
     * @param message message
     * @returns nothing
     */
  private status = async (ws: WS, message: wsResponse) => {
    const data = message.data as unknown as status;
    const bot = this.bots.get(data.id);

    if (!bot) {
      return ws.send(
        JSON.stringify({
          mid: message.mid,
          error: "bot not found",
        }),
      );
    }

    bot.updateGuilds(data.guilds);
  }

  /**
     * Returns all owlets.
     * @returns map of owlets
     */
  public getOwlets = (): Map<string, Owlet> => this.bots;

  /**
     * Returns the Owlet by the given id.
     */
  public getOwletById = (botId: string): Owlet | undefined =>
    this.bots.get(botId);

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

interface status {
  id: string;
  uptime: number;
  guilds: { id: string; channelId: string }[];
}

interface apiRequest {
  command: string;
  mid: string;
  data: any;
}

interface Guild {
  id: string;
  channelId: string;
}
