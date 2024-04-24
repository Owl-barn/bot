import { ReturnMessage } from "@structs/returnmessage";
import { ApplicationCommandOptionChoiceData, AutocompleteInteraction, ChatInputCommandInteraction, LocalizationMap } from "discord.js";
import { CommandInfo, CommandStruct } from "./command";
import { ParentCommandInfo, ParentCommandStruct } from "./parent";
import { SubCommandInfo, SubCommandStruct } from "./subcommand";
import { SubCommandGroupInfo, SubCommandGroupStruct } from "./subcommandgroup";

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

export type RunFunction<G extends boolean> = (interaction: ChatInputCommandInteraction<G extends true ? "cached" : undefined>) => Promise<ReturnMessage>;
export type AutocompleteFunction<G extends boolean, T> = (interaction: AutocompleteInteraction<G extends true ? "cached" : undefined>, value: T) => Promise<ApplicationCommandOptionChoiceData[]>;
export interface BaseCommandInfo {
  type?: CommandType;
  path?: string;
  commandName?: string;

  name: string;
  description: string;

  nameLocalization?: LocalizationMap;
  descriptionLocalization?: LocalizationMap;
}

export type CommandEnum =
  | ParentCommandStruct
  | SubCommandGroupStruct
  | SubCommandStruct
  | CommandStruct;

export type CommandInfoEnum =
  | ParentCommandInfo
  | SubCommandGroupInfo
  | SubCommandInfo
  | CommandInfo;
