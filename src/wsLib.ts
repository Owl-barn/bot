import ws, { WebSocket } from "ws";
import Client from "./types/client";

export class RavenWS {
    address: string;
    logging: boolean;
    eventCallbacks: any;
    password: string;
    sends: any; //: (x: any) => void;
    currentScene: string;
    sceneList: never[];
    ws: import("ws");
    resolve: (token: string) => void;
    token: string;
    timeout: number;

    /**
     * Creates a new RavenWS instance without connecting
     */
    constructor(address: string, password: string, logging = false) {
        this.address = address;
        this.logging = logging;
        this.password = password;
        this.timeout = 5000;

        this.eventCallbacks = {};
        this.sends = {};
        this.currentScene = "";
        this.sceneList = [];
        this.ws = new WebSocket(this.address);
    }

    /**
     * Connects to Raven-bot and returns a discord token
     */
    connect(): Promise<string> {
        this.ws = new WebSocket(this.address);
        this.ws.onopen = async () => {
            if (this.token != null) {
                await this.send("Authenticate", {
                    password: this.password,
                    token: this.token,
                }).then(async (msg: any) => {
                    if (msg.error) {
                        throw new Error(msg.error);
                    }

                    if (msg.token != null && msg.token !== this.token) {
                        throw new Error("Token received when not expected");
                    }

                    console.log(" > Successfully reconnected".cyan.bold);

                    if (this.resolve) this.resolve(this.token);

                    this.timeout = 5000;

                    if (this.eventCallbacks["ConnectionOpened"]) {
                        for (const callback of this.eventCallbacks[
                            "ConnectionOpened"
                        ]) {
                            const res = await callback();
                            this.send("Status", res, msg.mid);
                        }
                    }
                });
            } else {
                this.send("Authenticate", { password: this.password }).then(
                    async (msg: any) => {
                        if (msg.error) {
                            throw new Error(msg.error);
                        }

                        if (msg.token == null) {
                            throw new Error("No token received");
                        }

                        this.token = msg.token;

                        if (this.resolve) this.resolve(msg.token);

                        console.log(" > Successfully connected".cyan.bold);

                        this.timeout = 5000;

                        if (this.eventCallbacks["ConnectionOpened"]) {
                            for (const callback of this.eventCallbacks[
                                "ConnectionOpened"
                            ]) {
                                const res = await callback();
                                this.send("Status", res, msg.mid);
                            }
                        }
                    },
                );
            }
        };

        this.ws.onclose = (e: { reason: any }) => {
            if (!e.reason) {
                console.log(
                    `Socket is closed. Reconnect will be attempted in ${
                        this.timeout / 1000
                    } seconds`,
                    e.reason,
                );
                setTimeout(() => {
                    this.connect();
                }, this.timeout);

                this.timeout < 300000 ? (this.timeout *= 2) : null;
            }
        };

        this.ws.onerror = (err: { message: any }) => {
            console.error(
                "Socket encountered error: ",
                err.message,
                "Closing socket",
            );
            this.ws.close();
        };

        this.ws.onmessage = (message: ws.MessageEvent) => {
            const msg = JSON.parse(message.data.toString());
            if (this.logging) console.log("received".green.bold, msg);
            if (this.eventCallbacks[msg["command"]]) {
                for (const callback of this.eventCallbacks[msg["command"]]) {
                    callback(msg)
                        .then((x: Record<string, unknown>) => {
                            if (x) {
                                this.send("CommandResponse", x, msg.mid);
                            }
                        })
                        .catch((e: Error) => {
                            this.send("CommandResponse", { error: e }, msg.mid);
                        });
                }
            }
            if (this.sends[msg["mid"]]) {
                this.sends[msg["mid"]](msg);
                delete this.sends[msg["mid"]];
            }
        };

        return new Promise((resolve, reject) => {
            try {
                this.resolve = resolve;
            } catch (e) {
                reject(e);
            }
        });
    }

    clearCallbacks() {
        this.eventCallbacks = {};
    }

    on(type: string | number, callback: any) {
        if (this.eventCallbacks[type] == null) this.eventCallbacks[type] = [];
        this.eventCallbacks[type].push(callback);
    }

    send(type: string, data: any = {}, midString?: string): Promise<any> {
        const mid = midString || Math.random().toString(36).substring(7);
        if (this.ws.readyState === WebSocket.OPEN)
            return new Promise((resolve, reject) => {
                try {
                    if (this.logging)
                        console.log("sending".yellow.bold, {
                            command: type,
                            mid,
                            data,
                        });
                    this.ws.send(
                        JSON.stringify({
                            command: type,
                            mid,
                            data,
                        }),
                    );
                    this.sends[mid] = resolve;
                } catch (e) {
                    reject(e);
                }
            });
        else
            return new Promise((resolve, _reject) => {
                this.connect().then(() => {
                    const mid = Math.random().toString(36).substring(7);
                    if (this.logging)
                        console.log("sending", { command: type, mid, data });
                    this.ws.send(JSON.stringify({ command: type, mid, data }));
                    this.sends[mid] = resolve;
                });
            });
    }
}
