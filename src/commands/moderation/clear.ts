import { BaseGuildTextChannel, CommandInteraction, InteractionReplyOptions } from "discord.js";
import { argumentType } from "../../types/argument";
import { Command } from "../../types/Command";
import { CommandGroup } from "../../types/commandGroup";

module.exports = class extends Command {
    constructor() {
        super({
            name: "clear",
            description: "clear chat",
            group: CommandGroup.moderation,

            guildOnly: true,

            args: [
                {
                    type: argumentType.integer,
                    name: "amount",
                    description: "how many messages to delete",
                    required: true,
                },
            ],

            throttling: {
                duration: 30,
                usages: 3,
            },
        });
    }

    async execute(msg: CommandInteraction): Promise<InteractionReplyOptions> {
        return { content: "fuck off" };
        let amount = msg.options.getInteger("amount") as number;
        amount = amount <= 100 ? amount : 100;

        (msg.channel as BaseGuildTextChannel).bulkDelete(amount, true);

        // send embed.
        return { content: `deleted ${amount} messages` };
    }
};