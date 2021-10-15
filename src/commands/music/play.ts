import { GuildMember, MessageEmbed } from "discord.js";
import { argumentType } from "../../types/argument";
import { Command, returnMessage } from "../../types/Command";
import RavenInteraction from "../../types/interaction";
import RavenClient from "../../types/ravenClient";
import ytsearch from "ytsr";
import { DiscordGatewayAdapterCreator, entersState, joinVoiceChannel, VoiceConnectionStatus } from "@discordjs/voice";
import Song from "../../types/song";
import musicService from "../../modules/music.service";

module.exports = class extends Command {
    constructor() {
        super({
            name: "play",
            description: "Plays a song",
            group: "general",

            guildOnly: true,
            adminOnly: false,

            args: [
                {
                    type: argumentType.string,
                    name: "song",
                    description: "song name or url",
                    required: true,
                },
            ],

            throttling: {
                duration: 60,
                usages: 2,
            },
        });
    }

    async execute(msg: RavenInteraction): Promise<returnMessage> {
        const member = msg.member as GuildMember;
        const vc = member.voice.channel;
        const client = msg.client as RavenClient;
        const searchQuery = msg.options.getString("song") as string;

        if (vc === null) { return { content: "Join a voicechannel first." }; }

        const searchResult = await (await ytsearch(searchQuery, { limit: 1 })).items;

        let subscription = client.musicService.get(member.guild.id);
        if (!subscription) {

            const connection = joinVoiceChannel({
                channelId: vc.id,
                guildId: vc.guild.id,
                adapterCreator: vc.guild.voiceAdapterCreator as DiscordGatewayAdapterCreator,
            });

            subscription = new musicService(connection);

            subscription.voiceConnection.on("error", console.warn);
            client.musicService.set(member.guild.id, subscription);
        }

        const song = new Song(searchResult[0] as ytsearch.Video, msg.user.id);

        try {
            await entersState(subscription.voiceConnection, VoiceConnectionStatus.Ready, 20e3);
        } catch (e) {
            console.warn(e);
            return { content: "Failed to join vc" };
        }

        subscription.addToQueue(song);

        const embed = new MessageEmbed()
            .setThumbnail(song.thumbnail)
            .setTitle(subscription.queue.length < 1 ? `Now playing` : "Song queued")
            .setDescription(`[${song.title}](${song.url})`)
            .setColor(5362138)
            .setFooter(`${msg.user.username} <@${msg.user.id}>`, msg.user.displayAvatarURL())
            .setTimestamp();

        return { embeds: [embed] };
    }
};