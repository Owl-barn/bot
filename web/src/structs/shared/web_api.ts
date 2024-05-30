export type CommandTree = CommandTreeModule[];

export type CommandTreeItem = CommandTreeCommand | CommandTreeGroup;

export type CommandType = "Module" | "Group" | "Command";

export interface CommandTreeModule {
    type: "Module"
    name: string;
    description: string;
    commands: CommandTreeItem[];
}

export interface CommandTreeCommand extends Omit<CommandTreeModule, "type" | "commands"> {
    type: "Command"
    commandName: string;
    options?: CommandTreeOption[];
    examples?: string[];
}

export interface CommandTreeGroup extends Omit<CommandTreeModule, "type"> {
    type: "Group"
}


export interface CommandTreeOption {
    autoComplete: boolean;
    name: string;
    description: string;
    required: boolean;
    type: string;
}
