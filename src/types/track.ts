// disable broken semi rule here
/*  eslint semi: ["off", "always"]*/
export default interface Track {
    title: string;
    description: string;
    author: string;
    url: string;
    thumbnail: string;
    duration: string;
    durationMS: number;
    views: number;
    requestedBy: string;
    playlist?: unknown;
}
