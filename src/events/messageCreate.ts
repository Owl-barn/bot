import { self_role_main } from "@prisma/client";
import { Guild, GuildChannel, HexColorString, Message, MessageActionRow, MessageActionRowComponent, MessageButton, MessageEmbed, TextChannel } from "discord.js";
import AFKService from "../lib/afk.service";
import prisma from "../lib/db.service";
import { yearsAgo } from "../lib/functions.service";
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
        AFKService.onMessage(msg).catch((x) => console.error(x));
        const client = msg.client as RavenClient;

        if (msg.content === "-cookie" && msg.guildId === "396330910162616321") {
            msg.reply("$suppressErrors").catch((x) => console.log(x));
            return;
        }

        if (msg.content === "perms*" && msg.member?.id === process.env.OWNER_ID) {
            console.log(msg.guild?.me?.permissions.toArray());
            return;
        }

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

        if (msg.content.startsWith("age*") && msg.member?.id === process.env.OWNER_ID) {
            let birthdays = await prisma.birthdays.findMany({ where: { guild_id: msg.guildId as string } });
            let combined = 0;
            const currentYear = new Date().getFullYear();
            birthdays = birthdays.filter(x => x.birthday && x.birthday.getFullYear() > currentYear - 40);
            birthdays = birthdays.sort((x, y) => Number(y.birthday) - Number(x.birthday));
            birthdays.forEach(x => combined += yearsAgo(x.birthday as Date));
            const average = Math.round(combined / birthdays.length);
            msg.reply(`Average: ${average}\nMedian: ${yearsAgo(birthdays[Math.round(birthdays.length / 2)].birthday as Date)}\nRange: ${yearsAgo(birthdays[0].birthday as Date)} - ${yearsAgo(birthdays[birthdays.length - 1].birthday as Date)}`);
            return;
        }

        if (msg.content === "levels*" && (msg.member?.id === process.env.OWNER_ID || msg.member?.id === "308274118183223297")) {
            const staff = [
                "325734188101926912",
                "313259996739534849",
                "436272901700976659",
                "208623028798619648",
                "750593174593994843",
                "934705041879760926",
                "316004787378192384",
                "308274118183223297",
                "217742553632473089",
                "526876208521150503",
                "174689636310974464",
                "231932258519482368",
                "500022065009786900",
                "444610964575354901",
                "568441584639541259",
            ];

            const staffLevels = await client.db.level.findMany({ where: { user_id: { in: staff }, guild_id: "396330910162616321" }, orderBy: { experience: "desc" } });

            let response = "levels: \n";

            for (const x of staffLevels) {
                const member = await msg.guild?.members.fetch(x.user_id);
                if (!member) continue;
                const level = levelService.calculateLevel(x.experience);
                response += `${member?.user.username} - ${level.level} - ${((level.currentXP / level.levelXP) * 100).toFixed(2)}%\n`;
            }

            await msg.reply(response);
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
                embed.addField(`${x.emote} ${x.name} `, x.description);
                buttons.push(
                    new MessageButton()
                        .setCustomId(`selfrole_${x.uuid} `)
                        .setLabel(`${x.emote} ${x.name} `)
                        .setStyle("PRIMARY"),
                );
            });

            const component = new MessageActionRow()
                .addComponents(buttons);

            channel.send({ components: [component], embeds: [embed] });
        }

        // peepee poopoo
        const channels: string[] = ["456103889733681182", "404032420963418142", "426343728991698945"];

        if (channels.indexOf(msg.channelId) !== -1) {
            const channel = msg.channel as GuildChannel;
            console.log(`${msg.guild?.name} - ${channel.name} - ${msg.author.username}: `.magenta + msg.content.yellow || "EMPTY".red);

            if (msg.attachments) {
                msg.attachments.forEach(x => {
                    console.log(`   ${msg.guild?.name} - ${channel.name} - ${msg.author.username}:> `.magenta + x.url.yellow || "EMPTY".red);
                });
            }
        }
    }
}