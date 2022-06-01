import { ApplicationCommandOptionType } from "discord.js";
import { Command, returnMessage } from "../../types/Command";
import { CommandGroup } from "../../types/commandGroup";
import RavenInteraction from "../../types/interaction";
import birthdayDifference from "./birthday/difference.module";
import birthdayGet from "./birthday/get.module";
import birthdayRemove from "./birthday/remove.module";
import birthdaySet from "./birthday/set.module";
import birthdaySync from "./birthday/sync.module";

module.exports = class extends Command {
    constructor() {
        super({
            name: "birthday",
            description: "birthday",
            group: CommandGroup.general,

            guildOnly: true,

            args: [
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: "get",
                    description: "get a user's birthday",
                    subCommands: [
                        {
                            type: ApplicationCommandOptionType.User,
                            name: "user",
                            description: "Who's birthday to get",
                            required: false,
                        },
                    ],
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: "set",
                    description: "Add your birthday to the bot!",
                    subCommands: [
                        {
                            type: ApplicationCommandOptionType.String,
                            name: "birthday",
                            description:
                                "your birthday date formatted like: dd/mm/yyyy",
                            required: true,
                        },
                    ],
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: "difference",
                    description:
                        "get the difference between your birthday and another user's",
                    subCommands: [
                        {
                            type: ApplicationCommandOptionType.User,
                            name: "first_user",
                            description: "Who's birthday to compare",
                            required: true,
                        },
                        {
                            type: ApplicationCommandOptionType.User,
                            name: "second_user",
                            description: "Who's birthday to compare",
                            required: false,
                        },
                    ],
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: "sync",
                    description: "Fetch birthday from other server.",
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: "remove",
                    description: "Remove your birthday from this server.",
                },
            ],

            throttling: {
                duration: 60,
                usages: 3,
            },
        });
    }

    async execute(msg: RavenInteraction): Promise<returnMessage> {
        const subCommand = msg.options.getSubcommand(true);

        switch (subCommand) {
            case "set":
                return await birthdaySet(msg);
            case "get":
                return await birthdayGet(msg);
            case "difference":
                return await birthdayDifference(msg);
            case "sync":
                return await birthdaySync(msg);
            case "remove":
                return await birthdayRemove(msg);
            default:
                throw "no subcommand!??";
        }
    }
};
