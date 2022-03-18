import { argumentType } from "../../types/argument";
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
                    type: argumentType.subCommand,
                    name: "get",
                    description: "get a user's birthday",
                    subCommands: [
                        {
                            type: argumentType.user,
                            name: "user",
                            description: "Who's birthday to get",
                            required: false,
                        },
                    ],
                },
                {
                    type: argumentType.subCommand,
                    name: "set",
                    description: "set your birthday",
                    subCommands: [
                        {
                            type: argumentType.string,
                            name: "birthday",
                            description: "your birthday date formatted like: dd/mm/yyyy",
                            required: true,
                        },
                    ],
                },
                {
                    type: argumentType.subCommand,
                    name: "difference",
                    description: "get a user's birthday",
                    subCommands: [
                        {
                            type: argumentType.user,
                            name: "first_user",
                            description: "Who's birthday to compare",
                            required: true,
                        },
                        {
                            type: argumentType.user,
                            name: "second_user",
                            description: "Who's birthday to compare",
                            required: false,
                        },
                    ],
                },
                {
                    type: argumentType.subCommand,
                    name: "sync",
                    description: "Fetch birthday from other server.",
                },
                {
                    type: argumentType.subCommand,
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