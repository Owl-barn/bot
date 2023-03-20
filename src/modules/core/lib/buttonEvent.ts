import { state } from "@app";
import { ReturnMessage } from "@structs/returnmessage";
import { ButtonInteraction } from "discord.js";
import { errorEmbed } from "./interactionError";

export async function buttonEvent(msg: ButtonInteraction) {
  const options = msg.customId.split("_");
  const commandName = options[0];
  options.shift();
  msg.customId = options.join("_");

  const command = state.buttons.get(commandName);

  if (!command) return;

  const response = await command.run(msg).catch((e: Error) => {
    console.log(e);
    return {
      ephemeral: true,
      embeds: [errorEmbed],
    } as ReturnMessage;
  });

  if (Object.keys(response).length === 0) return;
  await msg.reply(response).catch(console.error);
}

