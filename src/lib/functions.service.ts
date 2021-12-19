import { GuildMember } from "discord.js";

export function isDJ(member: GuildMember): boolean {
    return member?.roles.cache.some(role => role.name === "DJ") || member.permissions.has("ADMINISTRATOR") || member.id == process.env.OWNER_ID;
}

export function nextDate(currentDate: Date): Date {
    const year = new Date().getUTCFullYear();
    const nextBirthday = currentDate;
    nextBirthday.setUTCFullYear(year);
    if (Number(nextBirthday) < Number(new Date())) nextBirthday.setUTCFullYear(year + 1);

    return nextBirthday;
}