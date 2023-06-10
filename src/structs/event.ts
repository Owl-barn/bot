import { ClientEvents } from "discord.js";

export interface EventStruct<T extends keyof ClientEvents> {
  name: T;
  once: boolean;
  ignoreBans?: boolean;
  execute(...args: ClientEvents[T]): Promise<void>;
}

export function Event<T extends keyof ClientEvents>(o: EventStruct<T>) {
  if (o.ignoreBans === undefined) o.ignoreBans = false;
  return o;
}

