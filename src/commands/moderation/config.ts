import { argumentType } from "../../types/argument";
import { Command, returnMessage } from "../../types/Command";
import { CommandGroup } from "../../types/commandGroup";
import RavenInteraction from "../../types/interaction";
import { configBirthdayResetRole } from "./config/birthday/resetRole.module";
import { configBirthdayResetUser } from "./config/birthday/resetUser.module";
import { configBirthdaySet } from "./config/birthday/set.module";
import configPermissionsAdd from "./config/permissions/add.module";
import configPermissionList from "./config/permissions/list.module";
import { configLevelRewardAdd } from "./config/level_rewards/add.module";
import { configLevelRewardRemove } from "./config/level_rewards/remove.module";
import { configLevelRewardReset } from "./config/level_rewards/reset.module";
import { configLevelToggle } from "./config/level/toggle.module";
import { configLevelSetMessage } from "./config/level/setMessage.module";
import { configLevelSetChannel } from "./config/level/setChannel.module";

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
                    name: "level_reward",
                    description: "Change level role rewards.",
                    subCommands: [
                        {
                            type: argumentType.subCommand,
                            name: "add",
                            description: "Add a role reward.",
                            subCommands: [
                                {
                                    type: argumentType.role,
                                    name: "role",
                                    description: "What role to add as reward.",
                                    required: true,
                                },
                                {
                                    type: argumentType.integer,
                                    name: "level",
                                    description: "What level to add a reward to.",
                                    required: true,
                                },
                            ],
                        },
                        {
                            type: argumentType.subCommand,
                            name: "remove",
                            description: "Remove a role reward",
                            subCommands: [
                                {
                                    type: argumentType.role,
                                    name: "role",
                                    description: "What role to add as reward.",
                                    required: true,
                                },
                            ],
                        },
                        {
                            type: argumentType.subCommand,
                            name: "reset",
                            description: "Reset all role rewards",
                        },
                    ],
                },
                {
                    type: argumentType.subCommandGroup,
                    name: "level",
                    description: "Configure the level system",
                    subCommands: [
                        {
                            type: argumentType.subCommand,
                            name: "toggle",
                            description: "Toggles the level system",
                            subCommands: [
                                {
                                    type: argumentType.boolean,
                                    name: "state",
                                    description: "turn the level sytem on or off?",
                                    required: true,
                                },
                            ],
                        },
                        {
                            type: argumentType.subCommand,
                            name: "channel",
                            description: "changes the level channel",
                            subCommands: [
                                {
                                    type: argumentType.channel,
                                    name: "channel",
                                    description: "What to set the level up channel to",
                                    required: false,
                                },
                            ],
                        },
                        {
                            type: argumentType.string,
                            name: "message",
                            description: "Changes the level up message.",
                            subCommands: [
                                {
                                    type: argumentType.string,
                                    name: "message",
                                    description: "What to set the level up message to",
                                    required: false,
                                },
                            ],
                        },
                        {
                            type: argumentType.subCommand,
                            name: "reset",
                            description: "Reset all user levels.",
                        },
                    ],
                },
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
                duration: 20,
                usages: 3,
            },
        });
    }

    async execute(msg: RavenInteraction): Promise<returnMessage> {
        const group = msg.options.getSubcommandGroup(true);

        const command = msg.options.getSubcommand(true);
        switch (group) {
            case "level_reward":
                switch (command) {
                    case "add": return await configLevelRewardAdd(msg);
                    case "remove": return await configLevelRewardRemove(msg);
                    case "reset": return await configLevelRewardReset(msg);
                }
                break;
            case "level":
                switch (command) {
                    case "toggle": return await configLevelToggle(msg);
                    case "message": return await configLevelSetMessage(msg);
                    case "channel": return await configLevelSetChannel(msg);
                    case "reset": return {};
                }
                break;
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