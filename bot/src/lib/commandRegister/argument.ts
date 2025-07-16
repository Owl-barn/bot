import { Argument, ArgumentChoice } from "@structs/command/argument";
import {
  ApplicationCommandOptionType,
  SlashCommandBooleanOption,
  SlashCommandChannelOption,
  SlashCommandIntegerOption,
  SlashCommandMentionableOption,
  SlashCommandNumberOption,
  SlashCommandRoleOption,
  SlashCommandStringOption,
  SlashCommandUserOption,
} from "discord.js";
import { builderType } from "./common";

type OptionBuilder =
  | SlashCommandMentionableOption
  | SlashCommandChannelOption
  | SlashCommandRoleOption
  | SlashCommandUserOption
  | SlashCommandStringOption
  | SlashCommandIntegerOption
  | SlashCommandNumberOption
  | SlashCommandBooleanOption;


export function argumentHandler<T extends builderType>(
  builder: T,
  argument: Argument,
): T {
  function argumentOptionHandler<V extends OptionBuilder>(option: V): V {
    option
      .setName(argument.name)
      .setDescription(argument.description)
      .setRequired(argument.required ? true : false);

    // Set localization if provided
    argument.nameLocalization &&
      option.setNameLocalizations(argument.nameLocalization);
    argument.descriptionLocalization &&
      option.setNameLocalizations(argument.descriptionLocalization);

    // Set min/max values for number types
    if (
      option.type == ApplicationCommandOptionType.Integer ||
      option.type == ApplicationCommandOptionType.Number
    ) {
      if (argument.min !== undefined) option.setMinValue(argument.min);
      if (argument.max !== undefined) option.setMaxValue(argument.max);
    }

    // Set min/max length for string types
    if (option.type === ApplicationCommandOptionType.String) {
      argument.max && option.setMaxLength(argument.max);
      argument.min && option.setMinLength(argument.min);
    }

    // Set choices if provided
    if (argument.choices) {
      if (option.type == ApplicationCommandOptionType.String)
        option.setChoices(...argument.choices as ArgumentChoice<string>[]);
      if (option.type == ApplicationCommandOptionType.Number)
        option.setChoices(...argument.choices as ArgumentChoice<number>[]);
    }

    // Set channel types if provided
    if (option.type === ApplicationCommandOptionType.Channel) {
      if (argument.allowedChannelTypes) {
        option.addChannelTypes(...argument.allowedChannelTypes);
      }
    }

    // Set autocomplete if provided
    if (argument.autoComplete !== undefined) {
      if (
        option.type == ApplicationCommandOptionType.String ||
        option.type == ApplicationCommandOptionType.Number ||
        option.type == ApplicationCommandOptionType.Integer
      )
        option.setAutocomplete(true);
    }

    return option;
  }

  switch (argument.type) {
    case ApplicationCommandOptionType.Mentionable:
      builder.addMentionableOption(argumentOptionHandler);
      break;
    case ApplicationCommandOptionType.Channel:
      builder.addChannelOption(argumentOptionHandler);
      break;
    case ApplicationCommandOptionType.Role:
      builder.addRoleOption(argumentOptionHandler);
      break;
    case ApplicationCommandOptionType.User:
      builder.addUserOption(argumentOptionHandler);
      break;
    case ApplicationCommandOptionType.String:
      builder.addStringOption(argumentOptionHandler);
      break;
    case ApplicationCommandOptionType.Integer:
      builder.addIntegerOption(argumentOptionHandler);
      break;
    case ApplicationCommandOptionType.Number:
      builder.addNumberOption(argumentOptionHandler);
      break;
    case ApplicationCommandOptionType.Boolean:
      builder.addBooleanOption(argumentOptionHandler);
      break;
  }

  return builder;
}
