import { state } from "@app";
import { generateMId } from "@lib/generateId";
import { AuthResponse, BaseMessage } from "./message";
import { EventEmitter } from "events";
import { Events } from "./events";
import WebSocket from "ws";

const test = new EventEmitter();

declare interface Server {
  on<U extends keyof Events>(event: U, listener: Events[U]): this;
  emit<U extends keyof Events>(event: U, ...args: Parameters<Events[U]>): boolean;
}

class Server extends EventEmitter {
  // Env
  private address = state.env.ADDRESS;
  private password = state.env.PASSWORD;
  private timeout = 5000;

  private sending: Map<string, (msg: any) => void> = new Map();
  private ws = new WebSocket(this.address);

  private token: string | null = null;
  resolve?: (token: string) => void;


  public connect = async (): Promise<string> => {
    this.ws = new WebSocket(this.address);
    this.ws.onopen = this.onOpen;
    this.ws.onmessage = this.onMessage;
    this.ws.onclose = this.onClose;
    this.ws.onerror = this.onError;

    return new Promise((resolve, reject) => {
      try {
        this.resolve = resolve;
      } catch (e) {
        reject(e);
      }
    });
  }

  private onOpen = async () => {
    // Send a reconnect/connect message to the server.
    const msg = await this.broadcast("Authenticate", {
      password: this.password,
      token: this.token ?? undefined,
    }) as BaseMessage<AuthResponse>;

    if (msg.data.error) throw new Error(msg.data.error);

    const newToken = msg.data.token;

    if (this.token) {
      // If we have a token, check if the token is the same.
      if (msg.data.token != null && msg.data.token !== this.token)
        throw new Error("Token received when not expected");

    } else {
      if (newToken == null) throw new Error("No token received");
      this.token = newToken;
    }

    // If we have a token, resolve the promise.
    if (this.resolve) this.resolve(this.token);
    state.log.ws.info("Successfully connected");

    // Reset the timeout.
    this.timeout = 5000;
    this.emit("ConnectionOpened");
  };

  private onMessage = (message: WebSocket.MessageEvent) => {
    const msg = JSON.parse(message.data.toString()) as BaseMessage;

    state.log.ws.debug(`Received message: ${msg.command}(${msg.mid})`, { data: msg });

    // If the message is an event, call the event listeners.
    if (msg.command) {
      this.emit("Command", msg);
    }

    // If the message is a response to a message we sent, resolve the promise
    const send = this.sending.get(msg.mid);
    if (send) {
      send(msg);
      this.sending.delete(msg.mid);
    }
  }

  private onClose = (error: WebSocket.CloseEvent) => {
    if (!error.reason) {
      state.log.ws.info(`Socket is closed. Reconnect will be attempted in ${this.timeout / 1000} seconds`, error.reason);

      // Try to reconnect after x seconds.
      setTimeout(() => {
        this.connect();
      }, this.timeout);

      // Double the timeout for the next attempt.
      this.timeout < 300000 ? (this.timeout *= 2) : null;
    }
  }

  private onError = (error: WebSocket.ErrorEvent) => {
    state.log.ws.error(`Socket encountered error:\n${error.message}\nClosing socket`);
    this.ws.close();
  }

  public broadcast = async (command: string, data: any = {}, midString?: string): Promise<BaseMessage> => {
    const mid = midString || generateMId();
    const message = { command, mid, data };

    // If the socket is open, send the message
    if (this.ws.readyState === WebSocket.OPEN)
      return new Promise((resolve, reject) => {

        try {
          state.log.ws.debug(`Sending message: ${message.command}(${message.mid})`, { data: message });

          this.ws.send(JSON.stringify(message));

          this.sending.set(mid, resolve);
        } catch (e) {
          reject(e);
        }
      });

    else
      // If the socket is not open, wait for it to open and then send the message
      return new Promise(async (resolve, _reject) => {
        await this.connect();

        const mid = generateMId();
        state.log.ws.debug(`Sending message: ${message.command}(${message.mid})`, { data: message });

        this.ws.send(JSON.stringify({ command: command, mid, data }));
        this.sending.set(mid, resolve);

      });
  }

}

export { Server };
