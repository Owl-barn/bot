import { Event } from "@structs/event";
import { localState } from "..";

export default Event({
  name: "channelCreate",
  once: false,

  async execute(channel) {
    channel && localState.log.debug(`new channel: ${channel.name.green} <#${channel.id}> in ${channel.guild.name.green}`);
  },

});
