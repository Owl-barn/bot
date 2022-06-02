import { GuildMember } from "discord.js";

export function isDJ(member: GuildMember): boolean {
    return (
        member?.roles.cache.some((role) => role.name === "DJ") ||
        member.permissions.has("Administrator") ||
        member.id == process.env.OWNER_ID
    );
}

export function randomRange(begin: number, end: number): number {
    return Math.floor(Math.random() * (end - begin)) + begin;
}

export function nextDate(pastDate: Date, currentDate = new Date()): Date {
    const year = currentDate.getUTCFullYear();
    const nextBirthday = pastDate;
    nextBirthday.setUTCFullYear(year);
    if (Number(nextBirthday) < Number(currentDate))
        nextBirthday.setUTCFullYear(year + 1);

    return nextBirthday;
}

export function yearsAgo(pastDate: Date, presentDate = new Date()): number {
    const difference = Number(presentDate) - Number(pastDate);
    return Math.floor(difference / (1000 * 60 * 60 * 24 * 365.25));
}

interface starSign {
    icon: string;
    name: string;
}

export function botIcon(bot: GuildMember | undefined): string | undefined {
    return bot
        ? bot.avatarURL() || bot.user.avatarURL() || bot.user.defaultAvatarURL
        : undefined;
}

export function getStarSign(date: Date): starSign {
    const month = date.getMonth() + 1;
    const day = date.getUTCDate();

    const signs = {
        capricorn: { icon: "♑", name: "Capricorn" },
        aquarius: { icon: "♒", name: "Aquarius" },
        pisces: { icon: "♓", name: "Pisces" },
        aries: { icon: "♈", name: "Aries" },
        taurus: { icon: "♉", name: "Taurus" },
        gemini: { icon: "♊", name: "Gemini" },
        cancer: { icon: "♋", name: "Cancer" },
        leo: { icon: "♌", name: "Leo" },
        virgo: { icon: "♍", name: "Virgo" },
        libra: { icon: "♎", name: "Libra" },
        scorpio: { icon: "♏", name: "Scorpio" },
        sagittarius: { icon: "♐", name: "Sagittarius" },
    };

    switch (month) {
        case 1:
            return day < 20 ? signs.capricorn : signs.aquarius;
        case 2:
            return day < 19 ? signs.aquarius : signs.pisces;
        case 3:
            return day < 21 ? signs.pisces : signs.aries;
        case 4:
            return day < 20 ? signs.aries : signs.taurus;
        case 5:
            return day < 21 ? signs.taurus : signs.gemini;
        case 6:
            return day < 21 ? signs.gemini : signs.cancer;
        case 7:
            return day < 23 ? signs.cancer : signs.leo;
        case 8:
            return day < 23 ? signs.leo : signs.virgo;
        case 9:
            return day < 23 ? signs.virgo : signs.libra;
        case 10:
            return day < 23 ? signs.libra : signs.scorpio;
        case 11:
            return day < 22 ? signs.scorpio : signs.sagittarius;
        case 12:
            return day < 22 ? signs.sagittarius : signs.capricorn;
        default:
            throw "no star sign?";
    }
}
