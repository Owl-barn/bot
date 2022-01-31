import { argumentType } from "../../types/argument";
import { Command, returnMessage } from "../../types/Command";
import { CommandGroup } from "../../types/commandGroup";
import RavenInteraction from "../../types/interaction";
import { configBirthdayResetRole } from "./config/birthday/resetRole.module";
import { configBirthdayResetUser } from "./config/birthday/resetUser.module";
import { configBirthdaySet } from "./config/birthday/set.module";
import configPermissionsAdd from "./config/permissions/add.module";
import configPermissionList from "./config/permissions/list.module";

module.exports = class extends Command {
    constructor() {
        super({
            name: "config",
            description: "birthday",
            group: CommandGroup.moderation,

            guildOnly: true,
            adminOnly: true,
            premium: false,

            args: [
                {
                    type: argumentType.subCommandGroup,
                    name: "birthday",
                    description: "Settings for birthday system",
                    subCommands: [
                        {
                            type: argumentType.subCommand,
                            name: "set",
                            description: "Set the birthday role",
                            subCommands: [
                                {
                                    type: argumentType.role,
                                    name: "birthday_role",
                                    description: "What role to set as birthday role.",
                                    required: true,
                                },
                            ],
                        },
                        {
                            type: argumentType.subCommand,
                            name: "reset_user",
                            description: "Resets someone's birthday and timer.",
                            subCommands: [
                                {
                                    type: argumentType.user,
                                    name: "birthday_user",
                                    description: "Who to reset.",
                                    required: true,
                                },
                            ],
                        },
                        {
                            type: argumentType.subCommand,
                            name: "reset_role",
                            description: "Reset the birthday role and turn off the auto role.",
                        },
                    ],
                },
                {
                    type: argumentType.subCommandGroup,
                    name: "permissions",
                    description: "Settings for command permissions",
                    subCommands: [
                        {
                            type: argumentType.subCommand,
                            name: "set",
                            description: "Add user/role to command.",
                            subCommands: [
                                {
                                    type: argumentType.string,
                                    name: "command_name",
                                    description: "What command to edit.",
                                    required: true,
                                },
                                {
                                    type: argumentType.boolean,
                                    name: "allow",
                                    description: "block or allow this role?",
                                    required: true,
                                },
                                {
                                    type: argumentType.role,
                                    name: "role",
                                    description: "What role to add.",
                                    required: false,
                                },
                                {
                                    type: argumentType.user,
                                    name: "user",
                                    description: "What user to add.",
                                    required: false,
                                },
                            ],
                        },
                        {
                            type: argumentType.subCommand,
                            name: "list",
                            description: "See current permission overrides.",
                        },
                    ],
                },
            ],

            throttling: {
                duration: 30,
                usages: 3,
            },
        });
    }

    async execute(msg: RavenInteraction): Promise<returnMessage> {
        const group = msg.options.getSubcommandGroup(true);
        const command = msg.options.getSubcommand(true);

        switch (group) {
            case "birthday":
                switch (command) {
                    case "set": return await configBirthdaySet(msg);
                    case "reset_role": return await configBirthdayResetRole(msg);
                    case "reset_user": return await configBirthdayResetUser(msg);
                }
                break;
            case "permissions":
                switch (command) {
                    case "set": return await configPermissionsAdd(msg);
                    case "list": return await configPermissionList(msg);
                }
                break;
        }
        return { content: "a" };
    }
};