import { InteractionReplyOptions } from "discord.js";
import GuildManager from "../../lib/guildManager";
import { argumentType } from "../../types/argument";
import { Command } from "../../types/Command";
import RavenInteraction from "../../types/interaction";

module.exports = class statsCommand extends Command {
    constructor() {
        super({
            name: "guild",
            description: "guild options",
            group: "owner",

            args: [
                {
                    type: argumentType.string,
                    name: "guild",
                    description: "guild id",
                    required: true,
                },
            ],

            guildOnly: false,
            adminOnly: true,

            throttling: {
                duration: 10,
                usages: 2,
            },
        });
    }

    async execute(msg: RavenInteraction): Promise<InteractionReplyOptions> {
        const guildID = msg.options.getString("guild") as string;

        const guildManager = new GuildManager(guildID, msg.client);
        await guildManager.delete();

        return { content: "hmm yes" };
    }
};