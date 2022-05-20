import {
    BaseGuildTextChannel,
    CommandInteraction,
    HexColorString,
    InteractionReplyOptions,
    MessageEmbed,
} from "discord.js";
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
        let amount = msg.options.getInteger("amount", true);
        amount = amount <= 100 ? amount : 100;

        (msg.channel as BaseGuildTextChannel).bulkDelete(amount, true);

        const embed = new MessageEmbed().setColor(
            process.env.EMBED_COLOR as HexColorString,
        );

        return { embeds: [embed.setDescription(`deleted ${amount} messages`)] };
    }
};
