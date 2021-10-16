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
    subCommand = 9
}

export interface Argument {
    type: argumentType;
    name: string;
    description: string;
    required: boolean;
    subCommand?: Argument;
}