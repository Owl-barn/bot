import { Event } from "@structs/event";

export default Event({
  name: "channelCreate",
  once: false,

  async execute(channel) {
    channel && console.log(`new channel: ${channel.name}: ${channel.guild.name}`.yellow);
  },

});
