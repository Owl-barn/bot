import { InteractionReplyOptions, MessageEmbed, User } from "discord.js";
import moment from "moment";
import { argumentType } from "../../types/argument";
import { Command } from "../../types/Command";
import RavenInteraction from "../../types/interaction";

module.exports = class extends Command {
    constructor() {
        super({
            name: "warnings",
            description: "shows a user's warnings",
            group: "moderation",

            guildOnly: true,
            adminOnly: false,

            args: [
                {
                    type: argumentType.user,
                    name: "user",
                    description: "which user's warnings to display.",
                    required: true,
                },
            ],

            throttling: {
                duration: 30,
                usages: 3,
            },
        });
    }

    async execute(msg: RavenInteraction): Promise<InteractionReplyOptions> {
        const db = msg.client.db;

        const target = msg.options.get("user")?.user as User;
        // Get from DB.
        const warnings = await db.warnings.findMany({ where: { target_id: target.id, guild_id: msg.guildId as string }, orderBy: { created: "asc" } });

        // Vars.
        let x = 0;
        const warns = [];
        // Loop through warnings
        for (const warning of warnings) {
            x++;
            // Get time.
            const date = moment(Number(new Date(warning.created))).fromNow();
            // Add warning to the list.
            warns.push({ name: `${x}`, value: `**mod:** <@!${warning.mod_id}>\n **reason:** ${warning.reason}\n **Date:** ${date}` });

        }
        // Make embed.
        const embed = new MessageEmbed()
            .setAuthor(`${target.tag} has ${warnings.length} warnings.`, target.avatarURL() as string)
            .setColor(5362138)
            .setTimestamp()
            .setFooter(`${msg.user.tag} - <@!${msg.user.id}>`);

        // Add warnings to embed or say there are none.
        warns.length !== 0 ? embed.addFields(warns) : embed.setDescription("This user has no warnings.");

        // Send embed.
        return { embeds: [embed] };
    }
};