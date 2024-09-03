import { ApplicationIntegrationType, InteractionContextType } from "discord.js";

export type CommandContext = {
  integrationTypes: ApplicationIntegrationType[];
  contexts: InteractionContextType[];
}

export const contextEverywhere: CommandContext = {
  integrationTypes: [ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall],
  contexts: [InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel],
};
