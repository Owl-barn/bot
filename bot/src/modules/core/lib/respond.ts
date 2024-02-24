import { state } from "@app";
import { ReturnMessage } from "@structs/returnmessage";
import { ChatInputCommandInteraction } from "discord.js";
import { localState } from "..";
import { errorEmbed } from "./interactionError";

export async function respond(
  interaction: ChatInputCommandInteraction,
  timeStart: number,
  func: (message: ChatInputCommandInteraction) => Promise<ReturnMessage | void>,
) {
  const hidden =
    interaction.options.get("hidden") === null
      ? false
      : (interaction.options.get("hidden")?.value as boolean);

  state.throttle.addToThrottle(
    interaction.guildId || "e",
    interaction.user.id,
    interaction.commandName,
  );

  const config = state.guilds.get(interaction.guildId || "e");

  const response: ReturnMessage | null = await func(interaction)
    .then((x) => {
      if (!x) return null;
      x.ephemeral = x.ephemeral || hidden;
      return x;
    })
    .catch((error) => {
      localState.log.error(`Error in command ${interaction.commandName.green}`, { error });
      return {
        ephemeral: true,
        embeds: [errorEmbed(config?.hideSupportInvite || false)],
      };
    });

  const processingDuration = Date.now() - timeStart;

  const logError = (error: Error) => {
    localState.log.error(`Error sending command response for ${interaction.commandName.green}`, { error });
  };

  if (!response) return;
  if (interaction.replied)
    await interaction
      .followUp(response)
      .catch(logError);

  else if (interaction.deferred)
    await interaction
      .editReply(response)
      .catch(logError);

  else
    await interaction
      .reply(response)
      .catch(logError);

  state.botLog.logCommand(interaction, processingDuration, hidden);

  if (response.callback)
    respond(interaction, 0, response.callback).catch(logError);
}

