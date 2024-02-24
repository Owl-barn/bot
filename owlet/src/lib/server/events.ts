import { BaseMessage } from "./message";
import { Commands } from "@structs/commands";

// export interface Events {
//   "ConnectionOpened": () => Promise<Record<string, unknown>>;
//   "ConnectionClosed": () => Promise<Record<string, unknown>>;
//   "Authenticate": (msg: any) => Promise<Record<string, unknown>>;
//   "Status": (msg: any, mid: string) => Promise<Record<string, unknown>>;
//   "CommandResponse": (msg: any, mid: string) => Promise<Record<string, unknown>>;
//   "Shutdown": (guildId: string, channelId: string | null) => Promise<Record<string, unknown>>;
// }


export interface CommandEvent<T extends keyof Commands> {
  (data: BaseMessage<Commands[T]["arguments"]>): Promise<Commands[T]["response"]>;
}
export interface Events {
  "Command": (data: BaseMessage<any>) => void;
  "ConnectionOpened": () => void;
}

export interface CommandEvents {
  "Queue": CommandEvent<"Queue">;
  "Loop": CommandEvent<"Loop">;
  "Pause": CommandEvent<"Pause">;
  "Play": CommandEvent<"Play">;
  "Skip": CommandEvent<"Skip">;
  "Status": CommandEvent<"Status">;
  "Stop": CommandEvent<"Stop">;
  "Terminate": CommandEvent<"Terminate">;
}

export type EventKey = keyof Events;
export type CommandEventKey = keyof CommandEvents;
