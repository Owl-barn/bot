import { GuildManager, InteractionReplyOptions, MessageEmbed } from "discord.js";
import moment from "moment";
import { Command } from "../../types/Command";
import RavenInteraction from "../../types/interaction";

module.exports = class statsCommand extends Command {
    constructor() {
        super({
            name: "guild",
            description: "guild options",
            group: "owner",

            guildOnly: false,
            adminOnly: true,
        });
    }

    async execute(msg: RavenInteraction): Promise<InteractionReplyOptions> {
        const client = msg.client;
        const guildID = "";

        const guildManager = new GuildManager(guildID)
        guildManager.delete();
    }
};