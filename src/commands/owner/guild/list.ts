import { AttachmentBuilder } from "discord.js";
import { returnMessage, SubCommand } from "../../../types/Command";
import RavenInteraction from "../../../types/interaction";

module.exports = class extends SubCommand {
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

        const guildInfo = await msg.client.db.guilds.findMany();
        const output = guilds
            .map((guild) => {
                const db = guildInfo.find((y) => y.guild_id == guild.id);
                return `id: ${guild.id} Premium: ${db?.premium} owner: ${guild.ownerId} membercount: ${guild.memberCount} name: ${guild.name}`;
            })
            .join("\n");

        const attachment = new AttachmentBuilder(Buffer.from(output));
        attachment.setName("info.txt");

        return { files: [attachment] };
    }
};
