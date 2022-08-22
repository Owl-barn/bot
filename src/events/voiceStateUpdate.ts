import { VoiceState } from "discord.js";
import bannedUsers from "../lib/banlist.service";
import GuildConfig from "../lib/guildconfig.service";
import VCService from "../modules/privateVC.service";
import voiceNotify from "../modules/voiceNotify";
import RavenEvent from "../types/event";

export default class ready implements RavenEvent {
    name = "voiceStateUpdate";
    once = false;

    async execute(oldState: VoiceState, newState: VoiceState): Promise<void> {
        if (GuildConfig.getGuild(newState.guild.id)?.banned) return;
        if (!newState.member || bannedUsers.isBanned(newState.member.id))
            return;

        await VCService.onChange(oldState, newState).catch((x) =>
            console.error(x),
        );

        await voiceNotify
            .onChange(oldState, newState)
            .catch((x) => console.error(x));
    }
}
