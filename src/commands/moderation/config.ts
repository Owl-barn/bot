import { Command, returnMessage } from "../../types/Command";
import { CommandGroup } from "../../types/commandGroup";
import RavenInteraction from "../../types/interaction";
import { configBirthdayResetUser } from "./config/birthday/resetUser.module";
import { configLevelRewardAdd } from "./config/level_rewards/add.module";
import { configLevelRewardRemove } from "./config/level_rewards/remove.module";
import { configLevelRewardReset } from "./config/level_rewards/reset.module";
import { configLevelToggle } from "./config/level/toggle.module";
import { configLevelSetMessage } from "./config/level/setMessage.module";
import { configLevelSetChannel } from "./config/level/setChannel.module";
import { configLevelRewardList } from "./config/level_rewards/list.module";
import { configBirthdaySetChannel } from "./config/birthday/setChannel.module";
import { configBirthdaySetRole } from "./config/birthday/setRole.module";
import { configLevelReset } from "./config/level/reset.module";
import configVoiceLimit from "./config/voice/limit.module";
import configVoiceToggle from "./config/voice/toggle.module";
import { ApplicationCommandOptionType } from "discord.js";

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
                    type: ApplicationCommandOptionType.SubcommandGroup,
                    name: "level_reward",
                    description: "Change level role rewards.",
                    subCommands: [
                        {
                            type: ApplicationCommandOptionType.Subcommand,
                            name: "add",
                            description: "Add a role reward.",
                            subCommands: [
                                {
                                    type: ApplicationCommandOptionType.Role,
                                    name: "role",
                                    description: "What role to add as reward.",
                                    required: true,
                                },
                                {
                                    type: ApplicationCommandOptionType.Integer,
                                    name: "level",
                                    description:
                                        "What level to add a reward to.",
                                    required: true,
                                },
                            ],
                        },
                        {
                            type: ApplicationCommandOptionType.Subcommand,
                            name: "remove",
                            description: "Remove a role reward",
                            subCommands: [
                                {
                                    type: ApplicationCommandOptionType.Role,
                                    name: "role",
                                    description: "What role to add as reward.",
                                    required: true,
                                },
                            ],
                        },
                        {
                            type: ApplicationCommandOptionType.Subcommand,
                            name: "list",
                            description: "Shows current level rewards",
                        },
                        {
                            type: ApplicationCommandOptionType.Subcommand,
                            name: "reset",
                            description: "Reset all role rewards",
                        },
                    ],
                },
                {
                    type: ApplicationCommandOptionType.SubcommandGroup,
                    name: "level",
                    description: "Configure the level system",
                    subCommands: [
                        {
                            type: ApplicationCommandOptionType.Subcommand,
                            name: "toggle",
                            description: "Toggles the level system",
                            subCommands: [
                                {
                                    type: ApplicationCommandOptionType.Boolean,
                                    name: "state",
                                    description:
                                        "turn the level sytem on or off?",
                                    required: true,
                                },
                            ],
                        },
                        {
                            type: ApplicationCommandOptionType.Subcommand,
                            name: "channel",
                            description: "changes the level channel",
                            subCommands: [
                                {
                                    type: ApplicationCommandOptionType.Channel,
                                    name: "channel",
                                    description:
                                        "What to set the level up channel to",
                                    required: false,
                                },
                            ],
                        },
                        {
                            type: ApplicationCommandOptionType.String,
                            name: "message",
                            description: "Changes the level up message.",
                            subCommands: [
                                {
                                    type: ApplicationCommandOptionType.String,
                                    name: "message",
                                    description:
                                        "What to set the level up message to",
                                    required: false,
                                },
                            ],
                        },
                        {
                            type: ApplicationCommandOptionType.Subcommand,
                            name: "reset",
                            description: "Reset all user levels.",
                        },
                    ],
                },
                {
                    type: ApplicationCommandOptionType.SubcommandGroup,
                    name: "birthday",
                    description: "Settings for birthday system",
                    subCommands: [
                        {
                            type: ApplicationCommandOptionType.Subcommand,
                            name: "set_role",
                            description: "Set the birthday role",
                            subCommands: [
                                {
                                    type: ApplicationCommandOptionType.Role,
                                    name: "birthday_role",
                                    description:
                                        "What role to set as birthday role.",
                                    required: false,
                                },
                            ],
                        },
                        {
                            type: ApplicationCommandOptionType.Subcommand,
                            name: "set_channel",
                            description: "Set the birthday channel",
                            subCommands: [
                                {
                                    type: ApplicationCommandOptionType.Channel,
                                    name: "birthday_channel",
                                    description:
                                        "Where to send happy birthday messages.",
                                    required: false,
                                },
                            ],
                        },
                        {
                            type: ApplicationCommandOptionType.Subcommand,
                            name: "reset_user",
                            description: "Resets someone's birthday and timer.",
                            subCommands: [
                                {
                                    type: ApplicationCommandOptionType.User,
                                    name: "birthday_user",
                                    description: "Who to reset.",
                                    required: true,
                                },
                            ],
                        },
                        {
                            type: ApplicationCommandOptionType.Subcommand,
                            name: "reset_role",
                            description:
                                "Reset the birthday role and turn off the auto role.",
                        },
                    ],
                },
                {
                    type: ApplicationCommandOptionType.SubcommandGroup,
                    name: "voice",
                    description: "settings for private vc",
                    subCommands: [
                        {
                            type: ApplicationCommandOptionType.Subcommand,
                            name: "toggle",
                            description: "toggles vc",
                        },
                        {
                            type: ApplicationCommandOptionType.Subcommand,
                            name: "limit",
                            description: "set max amount of private rooms",
                            subCommands: [
                                {
                                    type: ApplicationCommandOptionType.Integer,
                                    name: "amount",
                                    description: "How many rooms",
                                },
                            ],
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
                    case "add":
                        return await configLevelRewardAdd(msg);
                    case "remove":
                        return await configLevelRewardRemove(msg);
                    case "list":
                        return await configLevelRewardList(msg);
                    case "reset":
                        return await configLevelRewardReset(msg);
                }
                break;
            case "level":
                switch (command) {
                    case "toggle":
                        return await configLevelToggle(msg);
                    case "message":
                        return await configLevelSetMessage(msg);
                    case "channel":
                        return await configLevelSetChannel(msg);
                    case "reset":
                        return await configLevelReset(msg);
                }
                break;
            case "birthday":
                switch (command) {
                    case "set_role":
                        return await configBirthdaySetRole(msg);
                    case "set_channel":
                        return await configBirthdaySetChannel(msg);
                    case "reset_user":
                        return await configBirthdayResetUser(msg);
                }
                break;
            case "voice":
                switch (command) {
                    case "toggle":
                        return await configVoiceToggle(msg);
                    case "limit":
                        return await configVoiceLimit(msg);
                }
                break;
        }

        return { content: "a" };
    }
};
