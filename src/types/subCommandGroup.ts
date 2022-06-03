import { ApplicationCommandOptionType } from "discord.js";

export abstract class SubCommandGroup {
    public constructor(info: SubCommandInfo) {
        Object.assign(this, info);
    }

    public name!: string;
    public description!: string;
    public type!: ApplicationCommandOptionType.SubcommandGroup;

    public path?: string;
}

interface SubCommandInfo {
    name: string;
    description: string;
    type: ApplicationCommandOptionType.SubcommandGroup;

    path?: string;
}
