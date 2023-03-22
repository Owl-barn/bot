import WebSocket from "ws";
import { QueueEvent } from "../structs/queue";
import { Events } from "../structs/events";
import { EventEmitter } from "events";
import { Commands } from "../structs/commands";
import { baseData } from "../structs/websocket";
import { Guild } from "../structs/commands/status";
import { localState } from "..";

declare interface Owlet {
  on<U extends keyof Events>(event: U, listener: (data: Events[U]) => void): this;
  emit<U extends keyof Events>(event: U, data: Events[U]): boolean;
}

class Owlet extends EventEmitter {
  private id: string;
  private guilds: Map<string, Guild> = new Map();

  private shutdown = false;
  private socket: WebSocket;

  private promises: Map<string, Record<"resolve" | "reject", (x: any) => void>> = new Map();

  constructor(id: string, socket: WebSocket, guilds: Guild[]) {
    super();
    this.id = id;
    this.socket = socket;
    this.socket.on("message", this.onMessage);
    guilds.forEach((guild) => this.guilds.set(guild.id, guild));
  }

  private onMessage = async (data: WebSocket.Data): Promise<void> => {
    let message: {
      mid: string;
      data: Events[keyof Events] & baseData;
      command: keyof Events;
    };

    try {
      message = JSON.parse(data.toString());
    } catch (e) {
      localState.log.error("Failed to parse message", { data });
      return;
    }

    localState.log.debug(`Received message ${message.command.green}<${message.mid.cyan}> from <@${this.id.cyan}>`, { data: message });

    if (message.command === QueueEvent.Shutdown) this.shutdown = true;

    const promise = this.promises.get(message.mid);
    if (promise) {
      if (message.data.exception) promise.reject(message.data.exception);
      else promise.resolve(message.data);
      this.promises.delete(message.mid);
    }


    this.emit(message.command, message.data);
  };


  public getId = (): string => this.id;
  public isDisabled = (): boolean => this.shutdown;
  public getGuilds = () => this.guilds;
  public getGuild = (id: string) => this.guilds.get(id);

  public updateGuilds = (guilds: Guild[]): void => {
    localState.log.debug(`Updating guilds for <@${this.id.cyan}>`);
    for (const guild of guilds) this.guilds.set(guild.id, guild);
  };

  public terminate(now: boolean): void {
    this.runCommand("Terminate", { now }).catch(localState.log.error);
  }

  public async runCommand<T extends keyof Commands>(
    command: T,
    data: Commands[T]["arguments"],
    id?: string
  ): Promise<Commands[T]["response"] & baseData> {
    const mid = id || Math.random().toString(36).substring(7);
    const message = { mid, command, data };

    localState.log.debug(`Sending message ${command.green}<${mid.cyan}> to <@${this.id.cyan}>`, { data: message });

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

export { Owlet };
