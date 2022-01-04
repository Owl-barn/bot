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
            await db.guilds.createMany({ data: { guild_id: guild.id }, skipDuplicates: true });
            console.log(`Joined new guild, Id: ${guild.id} Owner: ${guild.ownerId} Name: ${guild.name}`.red.bold);
            const channel = guild.systemChannel;

            await registerCommand(guild.client as RavenClient, guild);
            await registerPerms(guild.client as RavenClient, guild);

            if (!channel) return;

            const embed = new MessageEmbed()
                .setTitle("Thank you!")
                .setDescription("thank you for inviting me! the server owner can configure the commands with /config")
                .addField("How do i play music?", `Right now the only way is to get a subscription, for more info and questions please [join the discord!](https://discord.gg/CD5xsWNbmU)`)
                .setThumbnail(guild.client.user?.avatarURL() || "")
                .setTimestamp()
                .setColor(process.env.EMBED_COLOR as HexColorString);


            const component = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setLabel("Donation")
                        .setStyle("LINK")
                        .setURL("https://ko-fi.com/owlive"),
                    new MessageButton()
                        .setLabel("Discord")
                        .setStyle("LINK")
                        .setURL("https://discord.gg/CD5xsWNbmU"),
                );

            await channel.send({ embeds: [embed], components: [component] }).catch(() => console.log("Couldnt send message in new server."));

        } catch (e) {
            console.error(e);
        }
    }
}