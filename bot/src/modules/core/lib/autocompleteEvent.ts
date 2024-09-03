import { AutocompleteInteraction } from "discord.js";
import { getCommand } from "./getCommand";


export async function AutocompleteEvent(msg: AutocompleteInteraction) {
  const command = getCommand(msg);

  const focused = msg.options.getFocused(true);
  const argument = command.info.arguments?.find((arg) => arg.name === focused.name);

  if (argument === undefined || argument.autoComplete === undefined) return;

  const response = await argument.autoComplete(msg, focused.value);

  await msg.respond(response);
}
