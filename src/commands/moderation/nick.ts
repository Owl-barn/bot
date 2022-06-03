import { ApplicationCommandOptionType, GuildMember } from "discord.js";
import { embedTemplate } from "../../lib/embedTemplate";
import { Command, returnMessage } from "../../types/Command";
import { CommandGroup } from "../../types/commandGroup";
import RavenInteraction from "../../types/interaction";

module.exports = class extends Command {
    constructor() {
        super({
            name: "nick",
            description: "changes the nickname for a user",
            group: CommandGroup.moderation,

            guildOnly: true,

            arguments: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: "nickname",
                    description: "Nickname to give the user",
                    required: true,
                },
                {
                    type: ApplicationCommandOptionType.User,
                    name: "user",
                    description: "User to change the nickname for",
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
        const nickname = msg.options.getString("nickname", true);
        let target = msg.options.getMember("user") as GuildMember | null;
        if (!target) target = msg.member as GuildMember;

        await target.setNickname(nickname);

        const embed = embedTemplate();
        embed.setDescription("Nickname changed");

        return { embeds: [embed] };
    }
};
