import {
    Interaction,
    InteractionReplyOptions,
    PermissionsString,
} from "discord.js";
import { Argument } from "./argument";
import { CommandGroup } from "./commandGroup";
import RavenInteraction from "./interaction";

export abstract class Command {
    public constructor(info: CommandInfo) {
        Object.assign(this, info);
    }

    public name!: string;
    public description!: string;
    public group!: CommandGroup;

    public guildOnly = false;
    public adminOnly?: boolean;
    public premium?: boolean;
    public disabled?: boolean;

    public args?: Argument[];

    public permissions?: PermissionsString[];

    public throttling!: Throttling;

    public path?: string;

    /**
     * Execute the command.
     * @param interaction The interaction that triggered the command.
     */
    abstract execute(interaction: Interaction): Promise<returnMessage>;
}

export interface CommandInfo {
    name: string;
    description: string;
    group: string;

    guildOnly: boolean;
    adminOnly?: boolean;
    premium?: boolean;
    disabled?: boolean;

    args?: Argument[];

    permissions?: PermissionsString[];

    throttling: Throttling;

    path?: string;
}

export interface Throttling {
    duration: number;
    usages: number;
}

export interface Permissions {
    test: string;
}

export interface returnMessage extends InteractionReplyOptions {
    callback?: (interaction: RavenInteraction) => Promise<returnMessage | void>;
}
