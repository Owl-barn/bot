import { CommandType } from ".";

export type CommandTree = CommandTreeModule[];

export interface CommandTreeModule {
  type?: CommandType;
  name: string;
  description: string;
  commands?: CommandTreeModule[];
}
