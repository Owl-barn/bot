import { state } from "@app";
import { DefaultExtractors } from "@discord-player/extractor";
import { BotQueue } from "@lib/queue/queue";
import { BotTrack } from "@lib/queue/track";
import { buildYoutubeStreamer } from "@lib/streamers/youtube";
import { GuildQueue, GuildQueueEvent, Player, Track } from "discord-player";
import { YoutubeiExtractor } from "discord-player-youtubei";
import { Client } from "discord.js";

const loadPlayer = async (client: Client): Promise<Player> => {
  const player = new Player(client);

  await player.extractors.loadMulti(DefaultExtractors);

  player.extractors.register(YoutubeiExtractor, {
    createStream: await buildYoutubeStreamer(),
  });


  // Queue end
  player.events.on(GuildQueueEvent.QueueDelete, (queue: GuildQueue<unknown>) => {
    if (!queue.channel) return;

    state.server.broadcast("QueueEnd", {
      channelId: queue.channel.id,
      guildId: queue.guild.id,
    });
  });

  player.events.on(GuildQueueEvent.PlayerFinish, (queue: GuildQueue<unknown>, track: Track<unknown>) => {
    state.server.broadcast("SongEnd", {
      track: new BotTrack(track),
      queue: new BotQueue(queue),
      channelId: queue.channel?.id,
      guildId: queue.guild.id,
    });
  });

  player.events.on(GuildQueueEvent.PlayerStart, (queue: GuildQueue<unknown>, track: Track<unknown>) => {
    if (queue.history.isEmpty()) return;
    state.server.broadcast("SongStart", {
      track: new BotTrack(track),
      queue: new BotQueue(queue),
      channelId: queue.channel?.id,
      guildId: queue.guild.id,
    });
  });

  return player;
};

export { loadPlayer };
