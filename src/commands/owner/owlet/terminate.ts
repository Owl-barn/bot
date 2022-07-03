import { ApplicationCommandOptionType } from "discord.js";
import { returnMessage, SubCommand } from "../../../types/Command";
import RavenInteraction from "../../../types/interaction";

module.exports = class extends SubCommand {
    constructor() {
        super({
            name: "terminate",
            description: "terminate all the owlets",

            arguments: [
                {
                    type: ApplicationCommandOptionType.User,
                    name: "owlet",
                    description: "the owlet to terminate",
                    required: false,
                },
            ],

            throttling: {
                duration: 60,
                usages: 3,
            },
        });
    }

    async execute(msg: RavenInteraction): Promise<returnMessage> {
        const owlet = msg.options.getUser("owlet");

        // If owlet is specified then terminate that owlet.
        if (owlet) {
            const bot = msg.client.musicService.getOwletById(owlet.id);
            if (!bot) return { content: "no bot found" };
            bot.terminate();
            return { content: `terminated <@${owlet.id}>` };
        }

        // If no owlet is specified, terminate all owlets.

        const count = msg.client.musicService.terminate();

        return { content: `Terminated all ${count} owlets` };
    }
};
