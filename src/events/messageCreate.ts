import { self_role_main } from "@prisma/client";
import { Guild, GuildChannel, HexColorString, Message, MessageActionRow, MessageActionRowComponent, MessageButton, MessageEmbed, TextChannel } from "discord.js";
import levelService from "../lib/level.service";
import registerCommand, { registerPerms } from "../modules/command.register";
import RavenEvent from "../types/event";
import RavenClient from "../types/ravenClient";

export default class InteractionCreate implements RavenEvent {
    name = "messageCreate";
    once = false;

    async execute(msg: Message): Promise<void> {
        if (!msg) return;
        if (msg.author.bot) return;
        levelService.message(msg).catch((x) => console.error(x));
        const client = msg.client as RavenClient;

        if (msg.content === "update*" && msg.member?.id === process.env.OWNER_ID) {
            const guilds = client.guilds.cache;
            const start = Date.now();
            await msg.reply("updating...");

            for (const guild of guilds.values()) {
                await registerCommand(client, guild);
                await registerPerms(client, guild);
            }

            await msg.reply(`Updated all server perms, took \`${Date.now() - start}ms\``);
            return;
        }

        if (msg.content === "fix*" && msg.member?.id === process.env.OWNER_ID) {
            if (!msg.guild) return;
            await client.db.guilds.createMany({ data: { guild_id: msg.guild.id }, skipDuplicates: true });
        }

        if (msg.content === "innit*" && msg.member?.id === process.env.OWNER_ID) {
            const start = Date.now();
            await registerCommand(client, msg.guild as Guild);
            await registerPerms(client, msg.guild as Guild);
            msg.reply(`Updated this server's perms, took \`${Date.now() - start}ms\``);
        }

        if (msg.content.startsWith("say*") && msg.member?.id === process.env.OWNER_ID) {
            const channel = client.guilds.cache.get("396330910162616321")?.channels.cache.get("504696026201063444") as TextChannel;
            await channel.send(msg.content.substring(5, msg.content.length));
        }

        if (msg.content === "selfroles*" && msg.member?.id === process.env.OWNER_ID) {
            const main = await client.db.self_role_main.findFirst({ where: { guild_id: msg.guildId as string } }) as self_role_main;
            const roles = await client.db.self_role_roles.findMany({ where: { main_uuid: main.uuid } });
            const guild = await client.guilds.fetch(main?.guild_id);
            const channel = guild.channels.cache.get(main.channel_id) as TextChannel;

            if (!channel) throw "aa";
            const embed = new MessageEmbed()
                .setTitle(main.title)
                .setFooter(main.uuid)
                .setDescription(main.message)
                .setColor(process.env.EMBED_COLOR as HexColorString);

            const buttons: MessageActionRowComponent[] = [];

            roles.forEach((x) => {
                embed.addField(`${x.emote} ${x.name}`, x.description);
                buttons.push(
                    new MessageButton()
                        .setCustomId(`selfrole_${x.uuid}`)
                        .setLabel(`${x.emote} ${x.name}`)
                        .setStyle("PRIMARY"),
                );
            });

            const component = new MessageActionRow()
                .addComponents(buttons);

            channel.send({ components: [component], embeds: [embed] });
        }
    }
}