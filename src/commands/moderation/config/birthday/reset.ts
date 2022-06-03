import {
    ApplicationCommandOptionType,
    EmbedBuilder,
    HexColorString,
} from "discord.js";
import { Command, returnMessage } from "../../../../types/Command";
import RavenInteraction from "../../../../types/interaction";

module.exports = class extends Command {
    constructor() {
        super({
            name: "reset",
            description: "Reset a user's birthday and their birthday timeout.",

            args: [
                {
                    type: ApplicationCommandOptionType.User,
                    name: "user",
                    description: "Who to reset.",
                    required: true,
                },
            ],

            throttling: {
                duration: 60,
                usages: 3,
            },
        });
    }

    async execute(msg: RavenInteraction): Promise<returnMessage> {
        if (!msg.guildId) throw "no guild??";
        const user = msg.options.getUser("user", true);

        await msg.client.db.birthdays.delete({
            where: {
                user_id_guild_id: { guild_id: msg.guildId, user_id: user.id },
            },
        });

        const embed = new EmbedBuilder()
            .setDescription(`Successfully reset <@${user.id}>'s birthday`)
            .setColor(process.env.EMBED_COLOR as HexColorString);

        return { embeds: [embed] };
    }
};
