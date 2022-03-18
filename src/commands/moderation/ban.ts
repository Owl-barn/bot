import { GuildMember, HexColorString, MessageEmbed, Util } from "discord.js";
import { argumentType } from "../../types/argument";
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
                    type: argumentType.user,
                    name: "user",
                    description: "User to ban",
                    required: true,
                },
                {
                    type: argumentType.string,
                    name: "reason",
                    description: "Reason why the user is getting banned",
                    required: true,
                },
            ],

            throttling: {
                duration: 30,
                usages: 3,
            },
        });
    }

    async execute(msg: RavenInteraction): Promise<returnMessage> {
        if (msg.user.id !== process.env.OWNER_ID) return {};
        let reason = msg.options.getString("reason");
        reason = reason ? Util.escapeMarkdown(reason).substring(0, 256) : "No reason provided";
        const target = msg.options.getMember("user", true) as GuildMember;

        if (!target.bannable) return { ephemeral: true, content: "I cant ban that person" };

        target.ban({ reason: reason.substring(0, 128), days: 1 });

        const embed = new MessageEmbed()
            .setTitle(`User has been banned`)
            .setDescription(`<@${target.id}> has been banned with the reason: \`${Util.escapeMarkdown(reason)}\``)
            .setColor(process.env.EMBED_COLOR as HexColorString);

        return { embeds: [embed] };
    }
};