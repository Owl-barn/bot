import { state } from "@app";
import { ProcessedReturnMessage, ReturnMessage } from "@structs/returnmessage";
import { ChatInputCommandInteraction, MessageFlags } from "discord.js";
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

  const response: ProcessedReturnMessage | null = await func(interaction)
    .then((x) => {
      if (!x) return null;
      if (x.ephemeral || hidden) {
        if (typeof x.flags === "number") {
          x.flags |= MessageFlags.Ephemeral;
        } else {
          x.flags = MessageFlags.Ephemeral;
        }
      }
      return x;
    })
    .catch((error) => {
      console.error(error);
      localState.log.error(`Error in command ${interaction.commandName.green}`, { error });
      return {
        flags: MessageFlags.Ephemeral,
        embeds: [errorEmbed(config?.hideSupportInvite || false)],
      };
    });

  const processingDuration = Date.now() - timeStart;

  const logError = (error: Error) => {
    console.error(error);
    localState.log.error(`Error sending command response for ${interaction.commandName.green}`, { error });
  };

  if (!response) return;
  if (interaction.replied)
    await interaction
      .followUp(response)
      .catch(logError);

  else if (interaction.deferred) {
    await interaction
      .editReply({ ...response, flags: undefined })
      .catch(logError);

  } else
    await interaction
      .reply(response)
      .catch(logError);

  state.botLog.logCommand(interaction, processingDuration, hidden);

  if (response.callback)
    respond(interaction, 0, response.callback).catch(logError);
}

