import { ApplicationCommandOptionAllowedChannelTypes, ApplicationCommandOptionType, ChannelType, LocalizationMap, SlashCommandChannelOption } from "discord.js";
import { AutocompleteFunction } from ".";

export enum ArgumentType {
  string = 1,
  integer = 2,
  number = 3,
  boolean = 4,
  user = 5,
  channel = 6,
  role = 7,
  mentionable = 8,
  subCommand = 9,
  subCommandGroup = 10,
}

export type Argument<T = string | number> = {
  type: Omit<
    ApplicationCommandOptionType,
    | ApplicationCommandOptionType.Subcommand
    | ApplicationCommandOptionType.SubcommandGroup
  >;

  name: string;
  description: string;
  required?: boolean;

  nameLocalization?: LocalizationMap;
  descriptionLocalization?: LocalizationMap;

  min?: number;
  max?: number;
  choices?: ArgumentChoice<T>[];
  allowedChannelTypes?: ApplicationCommandOptionAllowedChannelTypes[];
  // NOTE: i wish this type could be inferred
  autoComplete?: AutocompleteFunction<true, string>;
};

export type ArgumentChoice<T> = {
  name: string;
  value: T;
};
