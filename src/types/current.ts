import Track from "./track";

// disable broken semi rule here
/*  eslint semi: ["off", "always"]*/

export default interface currentSong extends Track {
  progress: string;
  progressMs: number;
}
