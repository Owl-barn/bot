import { GuildMember, HexColorString, ImageURLOptions, MessageEmbed } from "discord.js";
import moment from "moment";
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

        const birthdayQuery = await msg.client.db.birthdays.findUnique({ where: { user_id_guild_id: { user_id: member.id, guild_id: msg.guildId as string } } });
        const warnQuery = await msg.client.db.warnings.count({ where: { target_id: member.id as string } });

        const tag = `**tag:** ${member}`;
        const id = `**ID:** \`${member.id}\``;
        const created = `**Created:** <t:${Math.round(member.user.createdTimestamp / 1000)}>`;
        const joined = `**Joined:** <t:${Math.floor((member.joinedTimestamp || 0) / 1000)}>`;
        const birthday = birthdayQuery ? `**Birthday:** ${moment(birthdayQuery.birthday).format("DD-MM-YYYY")}` : "";
        const warnings = `**Warnings:** ${warnQuery}`;
        const bot = `${member.user.bot ? "**Bot:** ✅" : ""}`;

        const list = [tag, id, created, joined, birthday, warnings, bot].join("\n");
        const embed = new MessageEmbed()
            .setTitle(`${member.user.username}`)
            .setDescription(`${member.user.username}'s user info!`)
            .setThumbnail(avatar || member.user.defaultAvatarURL)
            .addField("Base info", list)
            .addField("Roles", `${roles.map(x => `${x}`).join(" ")}`)
            .setColor(process.env.EMBED_COLOR as HexColorString);

        return { embeds: [embed] };
    }
};