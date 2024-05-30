export type CommandTree = CommandTreeModule[];

export type CommandTreeItem = CommandTreeCommand | CommandTreeGroup;

export enum CommandType {
    Module = "Module",
    Group = "Group",
    Command = "Command",
}

export interface CommandTreeModule {
    type: CommandType.Module;
    name: string;
    description: string;
    commands?: CommandTreeItem[];
}

export interface CommandTreeCommand extends Omit<CommandTreeModule, "type"> {
    type: CommandType.Command
    commandName: string;
    options?: CommandTreeOption[];
    examples?: string[];
}

export interface CommandTreeGroup extends Omit<CommandTreeModule, "type"> {
    type: CommandType.Group
}


export interface CommandTreeOption {
    autoComplete: boolean;
}
