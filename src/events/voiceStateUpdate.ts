import { Event } from "@src/structs/event";
import bannedUsers from "../lib/banlist.service";
import GuildConfig from "../lib/guildconfig.service";
import VCService from "../modules/privateVC.service";
import voiceNotify from "../modules/voiceNotify";

export default Event({
  name: "voiceStateUpdate",
  once: false,

  async execute(oldState, newState) {
    if (GuildConfig.getGuild(newState.guild.id)?.banned) return;
    if (!newState.member || bannedUsers.isBanned(newState.member.id))
      return;

    await VCService
      .onChange(oldState, newState)
      .catch(console.error);

    await voiceNotify
      .onChange(oldState, newState)
      .catch(console.error);
  },

});
