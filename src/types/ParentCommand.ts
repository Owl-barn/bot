import { CommandGroup } from "./commandGroup";

export abstract class ParentCommand {
    public constructor(info: SubCommandInfo) {
        Object.assign(this, info);
    }

    public name!: string;
    public description!: string;
    public group!: CommandGroup;
}

interface SubCommandInfo {
    name: string;
    description: string;
    group: CommandGroup;
}
