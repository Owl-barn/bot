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
    resolve: any;

    /**
     * Creates a new RavenWS instance without connecting
     */
    constructor(
        address: string,
        password: string,
        callback: (x: any) => Promise<Client>,
        logging = false,
    ) {
        this.address = address;
        this.logging = logging;
        this.password = password;
        this.resolve = callback;

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
        this.ws.onopen = () => {
            this.send("Authenticate", { password: this.password }).then(
                async (msg: any) => {
                    if (!msg.success) {
                        throw new Error("Password incorrect");
                    }

                    if (msg.token == null) {
                        throw new Error("No token received");
                    }

                    if (this.resolve) await this.resolve(msg.token);

                    if (this.eventCallbacks["ConnectionOpened"]) {
                        for (const callback of this.eventCallbacks[
                            "ConnectionOpened"
                        ]) {
                            callback();
                        }
                    }
                },
            );
        };

        this.ws.onclose = (e: { reason: any }) => {
            if (!e.reason) {
                console.log(
                    "Socket is closed. Reconnect will be attempted in 5 seconds.",
                    e.reason,
                );
                setTimeout(() => {
                    this.connect();
                }, 5000);
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
