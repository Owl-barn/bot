import { state } from "@app";
import { ReturnMessage } from "@structs/returnmessage";
import { AnySelectMenuInteraction } from "discord.js";
import { localState } from "..";
import { errorEmbed } from "./interactionError";

export async function SelectEvent(msg: AnySelectMenuInteraction) {

  const command = state.interactables.selectmenus.get(msg.customId);

  if (!command) return;
  if (!command.info.isGlobal && !msg.inCachedGuild()) return;

  const config = state.guilds.get(msg.guildId || "e");

  const response: ReturnMessage = await command
    .run(msg)
    .catch((error) => {
      localState.log.error(`Error running button command: `, { error });
      return {
        ephemeral: true,
        embeds: [errorEmbed(config?.hideSupportInvite || false)],
      };
    });

  if (Object.keys(response).length === 0) return;

  let reply: Promise<unknown>;
  if (msg.replied) reply = msg.followUp(response);
  else reply = msg.reply(response);

  await reply
    .catch((error) => {
      localState.log.error(`Error sending button response: `, { error });
    });
}

