import { state } from "@app";
import { GuildMember } from "discord.js";
import { Owlet } from "./owlet";

export function isDJ(member: GuildMember): boolean {
  return (
    member?.roles.cache.some((role) => role.name === "DJ") ||
    member.permissions.has("Administrator") ||
    member.id == state.env.OWNER_ID
  );
}

export function canForce(member: GuildMember, owlet: Owlet, force = false): boolean {
  const isDJBool = isDJ(member);

  let isAlone = false;
  const vc = member.voice.channel;
  if (vc) {
    const memberCount = vc.members.filter((x) => !x.user.bot).size;
    isAlone = vc.id == owlet.getGuild(member.guild.id)?.channelId;
    isAlone = isAlone && memberCount == 1;
  }

  if (isAlone) return true;

  if (force) return isDJBool;


  return false;
}
