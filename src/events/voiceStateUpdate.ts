import { VoiceBasedChannel, VoiceState } from "discord.js";
import GuildConfig from "../lib/guildconfig.service";
import VCService from "../lib/privateVC.service";
import RavenEvent from "../types/event";
import RavenClient from "../types/ravenClient";

export default class ready implements RavenEvent {
    name = "voiceStateUpdate";
    once = false;

    async execute(oldState: VoiceState, newState: VoiceState): Promise<void> {
        if (GuildConfig.getGuild(newState.guild.id)?.banned) return;

        await VCService.onChange(oldState, newState).catch(x => console.error(x));
        const client = oldState.client as RavenClient;
        const subscription = client.musicService.get(oldState.guild.id);
        if (!subscription || subscription.destroyed) return;
        const botVC = subscription.voiceConnection.joinConfig.channelId;

        if (newState.member?.id === client.user?.id && newState.channel && this.vcSize(newState.channel) === 0) {
            subscription.setIdle(true);
            return;
        }

        const channelEqual = oldState.channelId === newState.channelId;
        const leaveVC = (oldState.channelId === botVC && !channelEqual && oldState.channelId);
        const deafen = (newState.channelId === botVC && (newState.deaf && !oldState.deaf));
        const joinVC = (newState.channelId === botVC && !channelEqual && !newState.deaf);
        const undeafen = (newState.channelId === botVC && (!newState.deaf && oldState.deaf));

        if (joinVC || undeafen) {
            subscription.setIdle(false);
            return;
        }

        if (leaveVC || deafen) {
            if (!oldState.channel) return;
            const people = this.vcSize(oldState.channel);
            if (people === 0) {
                if (people === 0) subscription.setIdle(true);
            }

            return;
        }
    }

    public vcSize = (channel: VoiceBasedChannel): number => {
        let people = 0;
        for (const x of channel.members.values()) {
            if (x.voice.deaf) continue;
            if (x.user.bot) continue;

            people += 1;
        }
        return people;
    }
}