import WebSocket from "ws";
import Queue from "../types/queue";
import QueueEvent from "../types/queueevent";
import Track from "../types/track";
import wsRequest from "../types/wsRequest";
import env from "./env";

export default class Owlet {
  private id: string;
  private guilds: Map<string, Guild> = new Map();
  private shutdown = false;
  private socket: WebSocket;
  private promises: Map<
  string,
  Record<"resolve" | "reject", (x: any) => void>
  > = new Map();
  private callbacks: Map<
  string,
  ((...args: any[]) => Promise<void> | void)[]
  > = new Map();

  public isDisabled = (): boolean => this.shutdown;

  constructor(id: string, socket: WebSocket, guilds: Guild[]) {
    this.id = id;
    this.socket = socket;
    this.socket.on("message", this.onMessage);
    guilds.forEach((guild) => this.guilds.set(guild.id, guild));
  }

  private onMessage = async (data: WebSocket.Data): Promise<void> => {
    let message: {
      mid: string;
      data: { track: Track; channelId: string; guildId: string };
      command: string;
    };

    try {
      message = JSON.parse(data.toString());
    } catch (e) {
      return;
    }

    if (message.command === QueueEvent.Shutdown) this.shutdown = true;

    const promise = this.promises.get(message.mid);
    if (promise) {
      promise.resolve(message.data);
      this.promises.delete(message.mid);
    }

    const messageData = message.data;

    const callbacks = this.callbacks
      .get(message.command)
      ?.map((callback) => callback(...Object.values(messageData)));

    if (!callbacks) return;

    Promise.all(callbacks).catch(console.error);
  };

  public on(
    event: QueueEvent.Shutdown,
    callback: (guildId: string, channelId: string) => Promise<void> | void,
  ): void;

  public on(
    event: QueueEvent.QueueEnd,
    callback: (queue: Queue) => Promise<void> | void,
  ): void;

  public on(
    event: QueueEvent.SongEnd | QueueEvent.SongStart | QueueEvent.SongError,
    callback: (
      track: Track,
      channelId: string,
      guildId: string,
    ) => Promise<void> | void,
  ): void;
  public on(
    event: QueueEvent | string,
    callback: (...args: any[]) => Promise<void> | void,
  ): void {
    if (!this.callbacks.get(event)) this.callbacks.set(event, []);
    this.callbacks.get(event)?.push(callback);
  }

  public getId = (): string => this.id;

  public getGuilds = (): Map<string, Guild> => this.guilds;

  public updateGuilds = (guilds: Guild[]): void => {
    console.log(`~ Updating guilds for <@${this.id}>`.cyan.italic);
    for (const guild of guilds) {
      this.guilds.set(guild.id, guild);
    }
  };

  public getGuild(id: string): Guild | undefined {
    return this.guilds.get(id);
  }

  public terminate(now: boolean): void {
    this.send({
      command: "Terminate",
      mid: "terminate",
      data: { now },
    }).catch(() => {
      null;
    });
  }

  /**
     * Sends a command to the owlet.
     * @param message message to send.
     * @returns promise of the owlet's response.
     */
  public async send<T>(message: wsRequest): Promise<T> {
    if (env.isDevelopment) console.log("Sent".yellow.bold, message);

    this.socket.send(JSON.stringify(message));
    const result = new Promise<T>((resolve, reject) => {
      this.promises.set(message.mid, { resolve, reject });
      setTimeout(() => {
        reject("Timeout");
      }, 10000);
    });

    return await result;
  }
}

interface Guild {
  id: string;
  channelId: string;
}
