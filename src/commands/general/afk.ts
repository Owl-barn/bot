import { HexColorString, MessageEmbed } from "discord.js";
import AFKService from "../../lib/afk.service";
import { argumentType } from "../../types/argument";
import { Command, returnMessage } from "../../types/Command";
import { CommandGroup } from "../../types/commandGroup";
import RavenInteraction from "../../types/interaction";

module.exports = class extends Command {
    constructor() {
        super({
            name: "afk",
            description: "tells people you are AFK",
            group: CommandGroup.general,

            guildOnly: true,

            args: [
                {
                    type: argumentType.string,
                    name: "reason",
                    description: "Why are you going AFK?",
                    required: false,
                },
                {
                    type: argumentType.boolean,
                    name: "global",
                    description: "Go AFK everywhere or just here? (defaults to true)",
                    required: false,
                },
            ],

            throttling: {
                duration: 60,
                usages: 1,
            },
        });
    }

    async execute(msg: RavenInteraction): Promise<returnMessage> {
        const client = msg.client;
        let global = msg.options.getBoolean("global");
        let reason = msg.options.getString("reason");

        global = global === null ? false : global;

        if (global || reason == null) reason = null;
        else reason = reason.substring(0, 127);

        await client.db.afk.deleteMany({ where: { user_id: msg.user.id, global: true } });

        const createQuery = await client.db.afk.create({
            data: {
                user_id: msg.user.id,
                guild_id: msg.guildId || "000000000000000000",
                reason,
                global,
            },
        });

        AFKService.setAFK(createQuery);


        const embed = new MessageEmbed()
            .setTitle(`AFK set`)
            .setDescription(`Successfully set you as AFK${reason ? ` message: \`\`${reason}\`\`` : ""} `)
            .setColor(process.env.EMBED_COLOR as HexColorString);

        return { embeds: [embed] };
    }
};