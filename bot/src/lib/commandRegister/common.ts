import { ApplicationIntegrationType, InteractionContextType, SlashCommandBuilder, SlashCommandSubcommandBuilder, SlashCommandSubcommandGroupBuilder, SlashCommandSubcommandsOnlyBuilder } from "discord.js";
import { argumentHandler } from "./argument";
import { CommandContext } from "@structs/command/context";
import { CommandGroup, CommandInfoEnum, CommandType } from "@structs/command";

export type builderType = SlashCommandBuilder | SlashCommandSubcommandBuilder;
export type ExtendedBuilderType = builderType | SlashCommandSubcommandGroupBuilder;
export const limitedGroups = [
  CommandGroup.moderation,
  CommandGroup.owner,
  CommandGroup.management,
  CommandGroup.config,
];

const defaultContext: CommandContext = {
  contexts: [InteractionContextType.Guild],
  integrationTypes: [ApplicationIntegrationType.GuildInstall],
};

/**
 * Add the ephemeral argument that every command should have.
 */
function addEphemeralArgument<T extends builderType>(builder: T): T {
  builder.addBooleanOption((option) => {
    option.setName("hidden");
    option.setDescription("Hide this command from others.");
    option.setRequired(false);
    return option;
  });

  return builder;
}

/**
 * Build the basics of any command.
 */
export function buildBaseCommand<T extends ExtendedBuilderType>(command: CommandInfoEnum<"processed">, builder: T): T {
  builder.setName(command.name);
  builder.setDescription(command.description);

  if (command.nameLocalization)
    builder.setNameLocalizations(command.nameLocalization);
  if (command.descriptionLocalization)
    builder.setDescriptionLocalizations(command.descriptionLocalization);

  // Set the default permissions for the command.
  if ("group" in command && command.group && limitedGroups.includes(command.group) && "setDefaultMemberPermissions" in builder) {
    builder.setDefaultMemberPermissions("0");
  }

  // Set the context for the command.
  if ("setIntegrationTypes" in builder) {
    let context = { ...defaultContext };
    if ("context" in command && command.context) context = command.context;
    builder = addCommandContext(builder, context) as T;
  }

  // Useable commands.
  if (builder instanceof SlashCommandBuilder || builder instanceof SlashCommandSubcommandBuilder) {
    // Add the options.
    if ("arguments" in command && command.arguments) {
      for (const argument of command.arguments) {
        builder = argumentHandler(builder as SlashCommandBuilder, argument) as T;
      }
    }

    // Add the ephemeral argument.
    if (command.type === CommandType.Default || command.type === CommandType.Subcommand) {
      if (!(builder instanceof SlashCommandBuilder || builder instanceof SlashCommandSubcommandBuilder)) throw "Command is not a valid builder.";
      builder = addEphemeralArgument(builder);
    }
  }


  return builder;
}

export function addCommandContext<T extends SlashCommandSubcommandsOnlyBuilder | SlashCommandBuilder>(builder: T, context: CommandContext): T {
  builder.setIntegrationTypes(...context.integrationTypes);
  builder.setContexts(...context.contexts);
  return builder;
}
