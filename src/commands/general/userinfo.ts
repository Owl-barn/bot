import { GuildMember, HexColorString, ImageURLOptions, MessageEmbed } from "discord.js";
import { argumentType } from "../../types/argument";
import { Command, returnMessage } from "../../types/Command";
import { CommandGroup } from "../../types/commandGroup";
import RavenInteraction from "../../types/interaction";

module.exports = class extends Command {
    constructor() {
        super({
            name: "userinfo",
            description: "view userinfo",
            group: CommandGroup.general,

            guildOnly: true,
            adminOnly: false,
            premium: false,

            args: [
                {
                    type: argumentType.user,
                    name: "user",
                    description: "Who's info to get",
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

        const settings: ImageURLOptions = { dynamic: true, size: 4096 };
        let member = msg.options.getMember("user") as GuildMember;
        member = member || msg.member;

        const avatar = member.avatarURL(settings) || member.user.avatarURL(settings);

        const roles = member.roles.cache.sort((x, y) => y.position - x.position);

        const embed = new MessageEmbed()
            .setTitle(`${member.user.username}`)
            .setDescription(`${member.user.username}'s user info!`)
            .setThumbnail(avatar || "a")
            .addField("Base info", `
                **tag:** ${member}
                **Created:** <t:${Math.round(member.user.createdTimestamp / 1000)}>
                **Joined:** <t:${Math.floor((member.joinedTimestamp || 0) / 1000)}>
                **ID:** \`${member.id}\`
                ${member.user.bot ? "**Bot:** ✅" : ""}
            `)
            .addField("Roles", `${roles.map(x => `${x}`).join(" ")}`)
            .setColor(process.env.EMBED_COLOR as HexColorString);

        return { embeds: [embed] };
    }
};