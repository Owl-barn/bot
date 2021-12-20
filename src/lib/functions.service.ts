import { GuildMember } from "discord.js";

export function isDJ(member: GuildMember): boolean {
    return member?.roles.cache.some(role => role.name === "DJ") || member.permissions.has("ADMINISTRATOR") || member.id == process.env.OWNER_ID;
}

export function nextDate(pastDate: Date, currentDate = new Date()): Date {
    const year = currentDate.getUTCFullYear();
    const nextBirthday = pastDate;
    nextBirthday.setUTCFullYear(year);
    if (Number(nextBirthday) < Number(currentDate)) nextBirthday.setUTCFullYear(year + 1);

    return nextBirthday;
}

export function yearsAgo(pastDate: Date, presentDate = new Date()): number {
    const difference = Number(presentDate) - Number(pastDate);
    return Math.floor(difference / (1000 * 60 * 60 * 24 * 365.25));
}