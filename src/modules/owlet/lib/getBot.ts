import { Guild, VoiceBasedChannel } from "discord.js";
import { localState } from "..";


export async function getOwlet(guild: Guild, vc: VoiceBasedChannel | null, botId: string | null) {
  try {
    // Get bot.
    const owlet = botId
      ? localState.controller.getOwletById(botId)
      : vc && localState.controller.getOwlet(vc.id, vc.guildId);

    if (!owlet) {
      throw "No available music bots.";
    }

    const bot = await guild.members.fetch(owlet.getId());

    return { owlet, bot };
  } catch (e) {
    localState.log.error(e);
    throw "Unable to get bot.";
  }
}
