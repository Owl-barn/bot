export const optionTypes: Record<keyof typeof ApplicationCommandOptionType, OptionType> = {
    String: {
        name: "String",
        color: "hsla(128, 100%, 37%, .4);"
    },
    Integer: {
        name: "Integer",
        color: "hsla(0, 100%, 37%, .4);"
    },
    Number: {
        name: "Number",
        color: "hsla(0, 100%, 37%, .4);"
    },
    Boolean: {
        name: "Boolean",
        color: "hsla(272, 100%, 37%, .4);"
    },
    User: {
        name: "User",
        prefix: "@",
        color: "hsla(53, 100%, 37%, .4);"
    },
    Mentionable: {
        name: "Mentionable",
        color: "hsla(53, 100%, 37%, .4);"
    },
    Channel: {
        name: "Channel",
        prefix: "#",
        color: "hsla(188, 100%, 37%, .4);"
    },
    Role: {
        name: "Role",
        prefix: "&",
        color: "hsla(206, 100%, 37%, .4);"
    },
    Attachment: {
        name: "Attachment",
        color: "hsla(42, 100%, 37%, .4);"
    }
};

export interface OptionType {
    name: string;
    prefix?: string;
    color: string;
}

declare enum ApplicationCommandOptionType {
    String = 3,
    Integer = 4,
    Boolean = 5,
    User = 6,
    Channel = 7,
    Role = 8,
    Mentionable = 9,
    Number = 10,
    Attachment = 11
}

