import { HexColorString, MessageEmbed, User, Util } from "discord.js";
import { argumentType } from "../../types/argument";
import { Command, returnMessage } from "../../types/Command";
import RavenInteraction from "../../types/interaction";

module.exports = class extends Command {
    constructor() {
        super({
            name: "warn",
            description: "warns a user",
            group: "moderation",

            guildOnly: true,
            adminOnly: false,

            args: [
                {
                    type: argumentType.user,
                    name: "user",
                    description: "User to warn",
                    required: true,
                },
                {
                    type: argumentType.string,
                    name: "reason",
                    description: "Reason why the user is getting warned",
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
        const db = msg.client.db;

        const hidden = msg.options.getBoolean("hidden");
        const reason = Util.escapeMarkdown(msg.options.get("reason")?.value as string).substr(0, 256);
        const target = msg.options.get("user")?.user as User;

        // insert into db.
        await db.warnings.create({ data: { target_id: target.id, reason: reason, guild_id: msg.guildId as string, mod_id: msg.user.id } })
            .catch((e: Error) => {
                console.log(e);
                throw { content: "an error occured" };
            });

        const warnCount = await db.warnings.count({ where: { target_id: target.id, guild_id: msg.guildId as string } });

        let colour: HexColorString;

        switch (warnCount) {
            case 1: colour = "#18ac15"; break;
            case 2: colour = "#d7b500"; break;
            default: colour = "#e60008"; break;
        }

        // make embed.
        const embed = new MessageEmbed()
            .setAuthor(`${target.username}#${target.discriminator} has been warned, ${warnCount} total`)
            .setDescription(`**reason:** ${reason}`)
            .setFooter(`${msg.user.username} <@${msg.user.id}>`, msg.user.displayAvatarURL())
            .setColor(colour)
            .setTimestamp();

        // send embed.
        return { embeds: [embed], content: hidden ? undefined : `${target}` };
    }
};