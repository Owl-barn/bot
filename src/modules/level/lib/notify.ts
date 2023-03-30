import { state } from "@app";
import { warningEmbedTemplate } from "@lib/embedTemplate";
import { logType } from "@lib/services/logService";
import { Guild, LevelReward } from "@prisma/client";
import { Message } from "discord.js";
import { CalculatedLevel } from "./calculateLevelFromXP";

export async function notify(msg: Message<true>, config: Guild, current: CalculatedLevel, roles: LevelReward[]) {

  let message = config.levelMessage;
  if (!message) return;

  // Replace the placeholders with the actual values.
  message = message.replace("{USER}", `<@${msg.author.id}>`);
  message = message.replace("{LEVEL}", String(current.level));
  message = message.replace("{XP}", String(current.levelXP));
  message = message.replace("{NEW_ROLES}", String(roles.length));

  if (config.levelChannelId) {
    const channel = await msg.guild.channels.fetch(config.levelChannelId);

    // If the channel is not found or not text based, remove the channel from the database.
    if (!channel || !channel.isTextBased()) {
      await state.db.guild.update({
        where: { id: msg.guildId },
        data: { levelChannelId: null },
      });

      // Log the error
      state.botLog.push(
        warningEmbedTemplate("I could not find or access the level channel. so it has been reset."),
        msg.guildId,
        logType.BOT
      );

      await msg.reply(message);
      return;
    }

    // If the channel is found, send the message.
    await channel.send(message);
    return;

  } else {
    // If the channel is not set, send the message to the user with a reply.
    msg.reply(message);
  }
}
