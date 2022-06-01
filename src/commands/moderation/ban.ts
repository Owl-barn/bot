import {
    GuildMember,
    HexColorString,
    EmbedBuilder,
    Util,
    ApplicationCommandOptionType,
} from "discord.js";
import { Command, returnMessage } from "../../types/Command";
import { CommandGroup } from "../../types/commandGroup";
import RavenInteraction from "../../types/interaction";

module.exports = class extends Command {
    constructor() {
        super({
            name: "ban",
            description: "bans a user",
            group: CommandGroup.moderation,

            guildOnly: true,

            args: [
                {
                    type: ApplicationCommandOptionType.User,
                    name: "user",
                    description: "User to ban",
                    required: true,
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: "reason",
                    description: "Reason why the user is getting banned",
                    required: true,
                },
                {
                    type: ApplicationCommandOptionType.Integer,
                    name: "days",
                    description: "Number of days to delete messages",
                    required: false,
                },
            ],

            throttling: {
                duration: 30,
                usages: 3,
            },
        });
    }

    async execute(msg: RavenInteraction): Promise<returnMessage> {
        let reason = msg.options.getString("reason");
        const days = msg.options.getInteger("days") ?? 0;

        reason = reason
            ? Util.escapeMarkdown(reason).substring(0, 256)
            : "No reason provided";
        const target = msg.options.getMember("user") as GuildMember | null;
        if (!target) return { content: "No user provided" };

        if (!target.bannable)
            return { ephemeral: true, content: "I cant ban that person" };

        target.ban({
            reason: reason.substring(0, 128),
            deleteMessageDays: days,
        });

        const embed = new EmbedBuilder()
            .setTitle(`User has been banned`)
            .setDescription(
                `<@${
                    target.id
                }> has been banned with the reason: \`${Util.escapeMarkdown(
                    reason,
                )}\``,
            )
            .setColor(process.env.EMBED_COLOR as HexColorString);

        return { embeds: [embed] };
    }
};
