import { CommandInteraction, InteractionReplyOptions, User } from "discord.js";
import { argumentType } from "../../types/argument";
import { Command } from "../../types/Command";
import RavenClient from "../../types/ravenClient";

module.exports = class extends Command {
    constructor() {
        super({
            name: "reload",
            description: "warns a user",
            group: "owner",

            guildOnly: false,
            adminOnly: true,

            args: [
                {
                    type: argumentType.subCommand,
                    name: "command",
                    description: "command to reload",
                    required: false,
                },
            ],

            throttling: {
                duration: 30,
                usages: 3,
            },
        });
    }

    async execute(msg: CommandInteraction): Promise<InteractionReplyOptions> {
        const db = (msg.client as RavenClient).db;

        const reason = msg.options.get("reason")?.value as string;
        const target = msg.options.get("user")?.user as User;

        return {};

    }
};