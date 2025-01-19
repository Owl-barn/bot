import { state } from "@app";
import { BotPlaylist } from "@lib/queue/playlist";
import { getQueueInfo } from "@lib/queue/queueInfo";
import { BotTrack } from "@lib/queue/track";
import { Command } from "@structs/command";

export default Command({
  // Command Info
  name: "Play",

  // Command Run
  async run(data) {
    const { guildId, channelId, userId, force, next, allowPlaylists, query } = data;

    const guild = await state.client.guilds.fetch(guildId);
    const channel = await guild.channels.fetch(channelId);
    const requestedBy = await state.client.users.fetch(userId);

    if (!channel || !channel.isVoiceBased()) return { error: "That is not a voice channel" };
    if (!channel.joinable) return { error: "I can't join this channel" };

    let queue = state.player.queues.get(guildId);

    const searchResult = await state.player.search(query, {
      requestedBy: userId,
    });

    searchResult.setRequestedBy(requestedBy);

    if (searchResult.hasPlaylist() && !allowPlaylists)
      return { error: "You are not allowed to queue playlists and albums" };

    if (searchResult.isEmpty())
      return { error: "I couldn't find that song." };


    let track = searchResult.tracks[0];
    let response;

    if (queue) {

      if ((next || force)) {
        // Add the song in the first queue position
        queue.insertTrack(track, 0);

      } else {
        // Add the song to the queue
        response = await queue.play(searchResult);
      }

      // Skip current song if forced
      if (force && queue.node.isPlaying()) {
        queue.node.skip();
      }

    } else {
      // Add the song to the queue
      try {
        response = await state.player.play(
          channel,
          searchResult,
          {
            nodeOptions: {
              leaveOnEmptyCooldown: state.env.IDLE_TIMEOUT,
              leaveOnEndCooldown: state.env.IDLE_TIMEOUT,
            }
          });
      } catch (error: any) {
        return { error: "I couldn't play that song." };
      }
    }

    if (response) {
      track = response.track;
      queue = response.queue;
    }

    if (!queue) throw new Error("Queue not found");

    return {
      track: new BotTrack(track, queue.node),
      playlist: searchResult.playlist && new BotPlaylist(searchResult.playlist),
      queueInfo: getQueueInfo(queue),
    };
  }
});
