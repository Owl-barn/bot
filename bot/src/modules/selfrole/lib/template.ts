import { ColorResolvable } from "discord.js";

export type Template = {
  title: string;
  description?: string;
  allowMultiple?: boolean;
  roles: {
    title: string;
    description?: string;
    emoji?: string;
    color?: ColorResolvable;
  }[];
}
export const templates: Template[] = [
  {
    title: "Pronouns",
    description: "Select which pronouns you'd prefer to be referred to as.",
    roles: [
      { title: "He/Him", description: "He/Him pronouns", emoji: "🚹" },
      { title: "She/Her", description: "She/Her pronouns", emoji: "🚺" },
      { title: "They/Them", description: "They/Them pronouns", emoji: "🚻" },
    ],
  },
  {
    title: "Region",
    description: "Select what region of earth 🌍 you're from",
    roles: [
      { title: "Europe", emoji: "🦉" },
      { title: "North America", emoji: "🫎" },
      { title: "South America", emoji: "🦜" },
      { title: "Asia", emoji: "🐘" },
      { title: "Africa", emoji: "🦁" },
      { title: "Australia", emoji: "🦘" },
    ],
  },
  {
    title: "Color",
    allowMultiple: false,
    roles: [
      { title: "Red", color: "Red" },
      { title: "Green", color: "Green" },
      { title: "Blue", color: "Blue" },
      { title: "Yellow", color: "Yellow" },
      { title: "Purple", color: "Purple" },
      { title: "Orange", color: "Orange" },
      { title: "White", color: "White" },
      { title: "Pink", color: "LuminousVividPink" },
    ],
  },
];
