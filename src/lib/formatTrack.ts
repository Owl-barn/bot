import { Track } from "discord-player";
import { Util } from "discord.js";

export default function formatTrack(track: Track) {
    track.title = Util.escapeMarkdown(
        (track.title || "couldnt load title")
            .substring(0, 48)
            .replace(/[()[\]]/g, ""),
    );

    return track;
}
