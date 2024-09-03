import { ImageURLOptions } from "@discordjs/rest";
import { APIInteractionDataResolvedGuildMember, APIInteractionGuildMember, GuildMember, PartialGuildMember, User } from "discord.js";

export function randomRange(begin: number, end: number): number {
  return Math.floor(Math.random() * (end - begin)) + begin;
}

interface starSign {
  icon: string;
  name: string;
}

export function getAvatar(
  member: GuildMember | User | undefined | APIInteractionGuildMember | APIInteractionDataResolvedGuildMember | PartialGuildMember,
): string | undefined {
  let avatar = undefined;
  if (!member) return avatar;
  const settings: ImageURLOptions = { size: 4096 };

  if (member instanceof GuildMember) {
    avatar =
      member.avatarURL(settings) ||
      member.user.avatarURL(settings) ||
      member.user.defaultAvatarURL ||
      undefined;
  } else if (member instanceof User) {
    avatar =
      member.avatarURL(settings) || member.defaultAvatarURL || undefined;
  }

  return avatar;
}

export function groupBy<K, V>(
  list: Array<V>,
  keyGetter: (input: V) => K,
): Map<K, Array<V>> {
  const map = new Map<K, Array<V>>();
  // const map = new Map();
  list.forEach((item) => {
    const key = keyGetter(item);
    const collection = map.get(key);
    if (!collection) {
      map.set(key, [item]);
    } else {
      collection.push(item);
    }
  });
  return map;
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
