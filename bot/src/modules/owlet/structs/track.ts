export interface Track {
  id: string;
  title: string;
  author: string;
  url: string;
  thumbnail: string;
  duration: string;
  durationMs: number;
  requestedBy: string;
  position?: number;
}

export interface CurrentTrack extends Track {
  progress: string;
  progressMs: number;
}
