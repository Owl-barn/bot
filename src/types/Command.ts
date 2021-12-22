import { Interaction, InteractionReplyOptions } from "discord.js";
import { Argument } from "./argument";
import RavenInteraction from "./interaction";

export abstract class Command {
    public constructor(info: CommandInfo) {
        Object.assign(this, info);
    }

    public name!: string;
    public description!: string;
    public group!: string;

    public guildOnly = false;
    public adminOnly = false;
    public disabled?: boolean;

    public args?: Argument[];

    public permissions?: Permissions;

    public throttling!: Throttling;

    public path?: string;

    abstract execute(interaction: Interaction): Promise<(returnMessage)>;
}

export interface CommandInfo {
    name: string;
    description: string;
    group: string;

    guildOnly: boolean;
    adminOnly: boolean;
    disabled?: boolean;

    args?: Argument[];

    permissions?: Permissions;

    throttling: Throttling;

    path?: string;
}

export interface Throttling {
    duration: number;
    usages: number;
}

export interface returnMessage extends InteractionReplyOptions {
    callback?: (interaction: RavenInteraction) => Promise<returnMessage | void>;
}