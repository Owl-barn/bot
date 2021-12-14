import { GuildMember } from "discord.js";

export function isDJ(member: GuildMember): boolean {
    return member?.roles.cache.some(role => role.name === "DJ") || member.permissions.has("ADMINISTRATOR") || member.id == process.env.OWNER_ID;
}