import { state } from "@app";
import { getQueueInfo } from "@lib/queue/queueInfo";
import { BotTrack } from "@lib/queue/track";
import { Command } from "@structs/command";
import { PlayerNodeInitializationResult } from "discord-player";

export default Command({
  // Command Info
  name: "Play",

  // Command Run
  async run(data) {
    const { guildId, channelId, userId, force, query } = data;

    const guild = await state.client.guilds.fetch(guildId);
    const channel = await guild.channels.fetch(channelId);
    const requestedBy = await state.client.users.fetch(userId);

    if (!channel || !channel.isVoiceBased()) return { error: "That is not a voice channel" };
    if (!channel.joinable) return { error: "I can't join this channel" };

    const queue = state.player.queues.get(guildId);

    const track = await state.player.search(query, {
      requestedBy: userId,
    });

    track.setRequestedBy(requestedBy);

    let response: PlayerNodeInitializationResult<unknown>;

    try {
      response = await state.player.play(
        channel,
        track,
        {
          nodeOptions: {
            leaveOnEmptyCooldown: state.env.IDLE_TIMEOUT,
            leaveOnEndCooldown: state.env.IDLE_TIMEOUT,
          }
        });

    } catch (error: any) {
      if ("code" in error) {
        if (error.code === "ERR_NO_RESULT") {
          return { error: "I couldn't find that song." };
        }
      }
      return { error: "I couldn't play that song." };
    }

    // Skip current song if forced
    if (queue && queue.node.isPlaying() && force) {
      queue.node.skip();
    }

    return {
      track: new BotTrack(response.track),
      queueInfo: getQueueInfo(response.queue),
    };
  }
});
