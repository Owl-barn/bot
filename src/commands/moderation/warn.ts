import { CommandInteraction, HexColorString, InteractionReplyOptions, MessageEmbed, User } from "discord.js";
import { argumentType } from "../../types/argument";
import { Command } from "../../types/Command";
import RavenClient from "../../types/ravenClient";

module.exports = class extends Command {
    constructor() {
        super({
            name: "warn",
            description: "warns a user",
            group: "moderator",

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

    async execute(msg: CommandInteraction): Promise<InteractionReplyOptions> {
        const db = (msg.client as RavenClient).db;

        const reason = msg.options.get("reason")?.value as string;
        const target = msg.options.get("user")?.user as User;

        // insert into db.
        const test = await db.warnings.create({ data: { target_id: target.id, reason: reason.substr(0, 256), guild_id: msg.guildId as string, mod_id: msg.user.id } })
            .catch((e: Error) => {
                console.log(e);
                throw { content: "an error occured" };
            });

        console.log(test);
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
            .setColor(colour);

        // send embed.
        return { embeds: [embed] };
    }
};