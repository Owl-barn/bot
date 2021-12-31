import { Guild, HexColorString, MessageActionRow, MessageButton, MessageEmbed } from "discord.js";
import registerCommand, { registerPerms } from "../modules/command.register";
import RavenEvent from "../types/event";
import RavenClient from "../types/ravenClient";

export default class implements RavenEvent {
    name = "guildCreate";
    once = false;

    async execute(guild: Guild): Promise<void> {
        try {
            if (!guild) throw "failed to register guild";

            const db = (guild.client as RavenClient).db;
            await db.guilds.create({ data: { guild_id: guild.id } });
            console.log(`Joined new guild, Id: ${guild.id} Owner: ${guild.ownerId} Name: ${guild.name}`.red.bold);
            const channel = guild.systemChannel;

            registerCommand(guild.client as RavenClient, guild);
            registerPerms(guild.client as RavenClient, guild);

            if (!channel) return;

            const embed = new MessageEmbed()
                .setTitle("Thank you!")
                .setDescription("thank you for inviting me! the bot is currently still under development. and its not sustainable to make this bot free and public yet")
                .addField("How do get access to the bot?", `Right now the only way is to subscribe to my ko-fi, if you have any questions please dm me! <@${process.env.OWNER_ID}>`)
                .setThumbnail(guild.client.user?.avatarURL() || "")
                .setTimestamp()
                .setColor(process.env.EMBED_COLOR as HexColorString);


            const component = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setLabel("Donate")
                        .setStyle("LINK")
                        .setURL("https://ko-fi.com/owlive"),
                );

            await channel.send({ embeds: [embed], components: [component] }).catch(() => console.log("Couldnt send message in new server."));

        } catch (e) {
            console.error(e);
        }
    }
}