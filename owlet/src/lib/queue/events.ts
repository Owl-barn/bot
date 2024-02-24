import { CurrentTrack, Track } from "@lib/track";


export type Events = {
  "SongEnd": (track: CurrentTrack, queue: Track[]) => void;
  "SongStart": (track: Track, queue: Track[]) => void;
  "QueueEnd": (queue: Track[]) => void;
  "SongError": (track: Track, queue: Track[]) => void;
  "Shutdown": (queue: Track[]) => void;
}

export type EventKey = keyof Events;
