import { ImageURLOptions } from "@discordjs/rest";
import {
    GuildMember,
    HexColorString,
    EmbedBuilder,
    ApplicationCommandOptionType,
} from "discord.js";
import { Command, returnMessage } from "../../types/Command";
import { CommandGroup } from "../../types/commandGroup";
import RavenInteraction from "../../types/interaction";

module.exports = class extends Command {
    constructor() {
        super({
            name: "avatar",
            description: "View avatar",
            group: CommandGroup.general,

            guildOnly: true,

            arguments: [
                {
                    type: ApplicationCommandOptionType.User,
                    name: "user",
                    description: "Who's avatar to get",
                    required: false,
                },
                {
                    type: ApplicationCommandOptionType.Boolean,
                    name: "global",
                    description: "public avatar or server avatar?",
                    required: false,
                },
            ],

            throttling: {
                duration: 60,
                usages: 2,
            },
        });
    }

    async execute(msg: RavenInteraction): Promise<returnMessage> {
        const settings: ImageURLOptions = {
            dynamic: true,
            size: 4096,
            extension: "png",
        };
        const user = msg.options.getMember("user") as GuildMember | null;
        const global = msg.options.getBoolean("global") ?? false;
        const member = user || (msg.member as GuildMember);
        let avatar;

        if (global) avatar = member.user.avatarURL(settings);
        else
            avatar =
                member?.avatarURL(settings) || member.user.avatarURL(settings);

        if (!avatar) throw "no avatar??";

        const embed = new EmbedBuilder()
            .setTitle(`${member.user.username}'s avatar`)
            .setImage(avatar)
            .setColor(process.env.EMBED_COLOR as HexColorString);

        return { embeds: [embed] };
    }
};
