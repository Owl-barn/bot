import { ReturnMessage } from "@structs/returnmessage";
import { ChatInputCommandInteraction, LocalizationMap } from "discord.js";
import { CommandStruct } from "./command";
import { ParentCommandStruct } from "./parent";
import { SubCommandStruct } from "./subcommand";
import { SubCommandGroupStruct } from "./subcommandgroup";

export enum CommandType {
  Parent = "Parent",
  SubcommandGroup = "SubcommandGroup",
  Subcommand = "Subcommand",
  Default = "Default",
}

export enum CommandGroup {
  owner = "owner",
  moderation = "moderation",
  management = "management",
  general = "general",
  config = "config",
  music = "music",
}

export type RunFunction = (interaction: ChatInputCommandInteraction) => Promise<ReturnMessage>;

export interface BaseCommandInfo {
  type?: CommandType;
  path?: string;

  name: string;
  description: string;

  nameLocalization?: LocalizationMap;
  descriptionLocalization?: LocalizationMap;
}

export interface Throttling {
  duration: number;
  usages: number;
}

export type CommandEnum =
  | ParentCommandStruct
  | SubCommandGroupStruct
  | SubCommandStruct
  | CommandStruct;
