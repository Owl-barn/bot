// disable broken semi rule here
/*  eslint semi: ["off", "always"]*/
export default interface Track {
  title: string;
  author: string;
  url: string;
  thumbnail: string;
  duration: string;
  durationMs: number;
  requestedBy: string;
}
