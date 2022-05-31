import currentSong from "./current";
import { QueueInfo } from "./queueInfo";
import Track from "./track";

// disable broken semi rule here
/*  eslint semi: ["off", "always"]*/

export default interface Queue {
    queue: Track[];
    current: currentSong;
    queueInfo: QueueInfo;
    loop: boolean;
}
