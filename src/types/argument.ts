import { ApplicationCommandOptionType } from "discord.js";

// eslint-disable-next-line no-shadow
export enum argumentType {
    string = 1,
    integer = 2,
    number = 3,
    boolean = 4,
    user = 5,
    channel = 6,
    role = 7,
    mentionable = 8,
    subCommand = 9,
    subCommandGroup = 10,
}

export interface Argument {
    type: ApplicationCommandOptionType;
    name: string;
    description: string;
    required?: boolean;
    subCommands?: Argument[];
    choices?: { name: string; value: string | number }[];
}
