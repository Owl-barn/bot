import { Attachment } from "discord.js";
import { Command, returnMessage } from "../../../types/Command";
import RavenInteraction from "../../../types/interaction";

module.exports = class extends Command {
    constructor() {
        super({
            name: "list",
            description: "List all guilds",

            throttling: {
                duration: 60,
                usages: 3,
            },
        });
    }

    async execute(msg: RavenInteraction): Promise<returnMessage> {
        const guilds = msg.client.guilds.cache.sort(
            (x, y) => y.memberCount - x.memberCount,
        );
        const output = guilds
            .map(
                (x) =>
                    `id: ${x.id} owner: ${x.ownerId} membercount: ${x.memberCount} name: ${x.name}`,
            )
            .join("\n");

        const attachment = new Attachment(Buffer.from(output), "info.txt");

        return { files: [attachment] };
    }
};
