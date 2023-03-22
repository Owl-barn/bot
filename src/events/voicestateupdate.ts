import { state } from "@app";
import { VoiceBasedChannel } from "discord.js";
import { Event } from "@structs/event";
import status from "commands/status";

export default Event({
  name: "voiceStateUpdate",
  once: false,

  async execute(oldState, newState) {

    if (oldState.id === newState.client.user?.id) {
      state.server.broadcast("Status", await status.run({}));
    }

    const client = oldState.client;
    const subscription = state.controller.getQueue(oldState.guild.id);
    if (!subscription || subscription.destroyed) return;
    const botVC = subscription.voiceConnection.joinConfig.channelId;

    if (
      newState.member?.id === client.user?.id &&
      newState.channel &&
      vcSize(newState.channel) === 0
    ) {
      subscription.setIdle(180000);
      return;
    }

    const channelEqual = oldState.channelId === newState.channelId;
    const leaveVC =
      oldState.channelId === botVC && !channelEqual && oldState.channelId;
    const deafen =
      newState.channelId === botVC && newState.deaf && !oldState.deaf;
    const joinVC =
      newState.channelId === botVC && !channelEqual && !newState.deaf;
    const undeafen =
      newState.channelId === botVC && !newState.deaf && oldState.deaf;

    // User joins or undeafens vc, timer is reset
    if (joinVC || undeafen) {
      subscription.clearIdle();
      return;
    }

    // User leaves vc/deafens, timer is set
    if (leaveVC || deafen) {
      if (!oldState.channel) return;
      const people = vcSize(oldState.channel);

      if (people === 0) {
        if (people === 0) subscription.setIdle(180000);
      }

      return;
    }
  }
});

function vcSize(channel: VoiceBasedChannel): number {
  let people = 0;
  for (const x of channel.members.values()) {
    if (x.voice.deaf) continue;
    if (x.user.bot) continue;

    people += 1;
  }
  return people;
}
