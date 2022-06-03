import { PermissionsString, ApplicationCommandOptionType } from "discord.js";
import { Argument } from "./argument";
import { Throttling, returnMessage } from "./Command";
import RavenInteraction from "./interaction";

export abstract class SubCommand {
    public constructor(info: SubCommandInfo) {
        Object.assign(this, info);
    }

    public name!: string;
    public description!: string;
    public type!: ApplicationCommandOptionType.Subcommand;

    public premium?: boolean;
    public disabled?: boolean;

    public args?: Argument[];

    public userPermissions?: PermissionsString[];
    public botPermissions?: PermissionsString[];

    public throttling!: Throttling;

    public path?: string;

    /**
     * Execute the command.
     * @param interaction The interaction that triggered the command.
     */
    abstract execute(interaction: RavenInteraction): Promise<returnMessage>;
}

interface SubCommandInfo {
    name: string;
    description: string;
    type: ApplicationCommandOptionType.Subcommand;

    premium?: boolean;
    disabled?: boolean;

    args?: Argument[];

    userPermissions?: PermissionsString[];
    botPermissions?: PermissionsString[];

    throttling: Throttling;

    path?: string;
}
