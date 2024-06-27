import { ReturnMessage } from "@structs/returnmessage";
import { ApplicationCommandOptionChoiceData, AutocompleteInteraction, ChatInputCommandInteraction } from "discord.js";
import { CommandInfo, CommandStruct } from "./command";
import { ParentCommandInfo, ParentCommandStruct } from "./parent";
import { SubCommandInfo, SubCommandStruct } from "./subcommand";
import { SubCommandGroupInfo, SubCommandGroupStruct } from "./subcommandgroup";
import { CommandStage } from "./basecommand";

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

export type ExecutableCommand<Stage extends CommandStage> = CommandStruct<Stage> | SubCommandStruct<Stage>;
export type GroupCommand<Stage extends CommandStage> = ParentCommandStruct<Stage> | SubCommandGroupStruct<Stage>;

export type CommandEnum<Stage extends CommandStage> =
  | ParentCommandStruct<Stage>
  | SubCommandGroupStruct<Stage>
  | SubCommandStruct<Stage>
  | CommandStruct<Stage>

export type CommandInfoEnum<Stage extends CommandStage> =
  | ParentCommandInfo<Stage>
  | SubCommandGroupInfo<Stage>
  | SubCommandInfo<Stage>
  | CommandInfo<Stage>
