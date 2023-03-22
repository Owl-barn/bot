import { state } from "@app";
import { GuildMember } from "discord.js";

export function isDJ(member: GuildMember): boolean {
  return (
    member?.roles.cache.some((role) => role.name === "DJ") ||
    member.permissions.has("Administrator") ||
    member.id == state.env.OWNER_ID
  );
}
