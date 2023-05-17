import { Button } from "@structs/button";
import { embedTemplate } from "@lib/embedTemplate";
import { isDJ } from "../lib/isdj";

export default {
  name: "track-rm",

  async run(msg) {
    if (!msg.guildId) throw "No guild";

    const trackID = msg.customId.trim();
    const dj = isDJ(msg.member);

    console.log(trackID);

    return { embeds: [embedTemplate("Track Removed!")], ephemeral: true };
  },

} as Button;
