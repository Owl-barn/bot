import { InteractionReplyOptions, WebhookClient } from "discord.js";
import { argumentType } from "../../types/argument";
import { Command } from "../../types/Command";
import RavenInteraction from "../../types/interaction";

module.exports = class WebhookCommand extends Command {
    constructor() {
        super({
            name: "webhook",
            description: "deletes webhook",
            group: "owner",

            args: [
                {
                    type: argumentType.string,
                    name: "webhook",
                    description: "webhook URL",
                    required: true,
                },
            ],

            guildOnly: false,
            adminOnly: false,
        });
    }

    async execute(msg: RavenInteraction): Promise<InteractionReplyOptions> {
        const url = msg.options.getString("webhook") as string;

        const webhookClient = new WebhookClient({ url });

        const deleted = await webhookClient.delete().catch(() => false).then(() => true);

        if (!deleted) return { content: "Failed" };
        return { content: "Webhook succesfully deleted" };
    }
};