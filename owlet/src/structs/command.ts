import { Commands } from "@structs/commands";

interface baseResponse {
  error?: string;
}

export interface CommandStruct<T extends keyof Commands> {
  name: T;
  run: (data: Commands[T]["arguments"]) => Promise<Commands[T]["response"] | baseResponse>;
}

export const Command = <T extends keyof Commands>(o: CommandStruct<T>) => o;
