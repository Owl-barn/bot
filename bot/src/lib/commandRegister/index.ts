import { state } from "@app";
import { CommandTreeItem } from "@structs/shared/web_api";
import { REST, Routes } from "discord.js";
import { convertCommandToBuilder } from "./convert";

export default async function registerCommands(guildId?: string) {
  const commandTree = state.commandTree.reduce((total, current) => total.concat(current.commands), [] as CommandTreeItem[]);

  let commands = commandTree.map((command) => convertCommandToBuilder(command));

  const config = guildId ? state.guilds.get(guildId) : undefined;
  if (config?.isDev) {
    commands = commands.concat(state.ownerCommandTree.map((command) => convertCommandToBuilder(command)));
  }

  const commandJson = commands.map((command) => command.toJSON());

  const rest = new REST({ version: "10" }).setToken(state.env.DISCORD_TOKEN);

  if (!state.client.user) throw "Client user is undefined.";

  await rest
    .put(
      guildId
        ? Routes.applicationGuildCommands(state.client.user.id, guildId,)
        : Routes.applicationCommands(state.client.user.id),
      { body: commandJson },
    )
    .then(() => {
      state.log.info(`Successfully registered application commands.` + (guildId ? ` Guild: ${guildId}` : ""));
    })
    .catch(error => {
      state.log.error(`Failed to register application commands.` + (guildId ? ` Guild: ${guildId}` : ""), { error });
    });
}
