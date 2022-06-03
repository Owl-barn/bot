import Track from "./track";

// disable broken semi rule here
/*  eslint semi: ["off", "always"]*/

export default interface currentSong extends Track {
    current: string;
    end: string;
    progress: number;
}
