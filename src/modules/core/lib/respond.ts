import { state } from "@app";
import { ReturnMessage } from "@structs/returnmessage";
import { ChatInputCommandInteraction } from "discord.js";
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

  const response = await func(interaction)
    .then((x) => {
      if (!x) return null;
      x.ephemeral = x.ephemeral || hidden;
      return x;
    })
    .catch((e: Error) => {
      console.log(e);
      return {
        ephemeral: true,
        embeds: [errorEmbed],
      } as ReturnMessage;
    });

  const processingDuration = Date.now() - timeStart;

  if (!response) return;
  if (interaction.replied)
    await interaction.followUp(response).catch(console.error);
  else if (interaction.deferred)
    await interaction
      .editReply(response)
      .catch(console.error);
  else await interaction.reply(response).catch(console.error);

  state.log.logCommand(interaction, processingDuration, hidden);

  if (response.callback)
    respond(interaction, 0, response.callback).catch(console.error);
}

