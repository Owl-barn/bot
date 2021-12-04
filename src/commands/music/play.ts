import { GuildMember, MessageEmbed } from "discord.js";
import { argumentType } from "../../types/argument";
import { Command, returnMessage } from "../../types/Command";
import RavenInteraction from "../../types/interaction";
import RavenClient from "../../types/ravenClient";
import { DiscordGatewayAdapterCreator, entersState, joinVoiceChannel, VoiceConnectionStatus } from "@discordjs/voice";
import Song from "../../types/song";
import musicService from "../../modules/music.service";
import * as play from "play-dl";

module.exports = class extends Command {
    constructor() {
        super({
            name: "play",
            description: "Plays a song",
            group: "music",

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

        let searchResult: play.YouTubeVideo;

        if (searchQuery.startsWith("https") && play.yt_validate(searchQuery) === "video") {
            searchResult = await (await play.video_info(searchQuery)).video_details;
        } else {
            searchResult = (await play.search(searchQuery, { source: { youtube: "video" }, limit: 1, fuzzy: true }))[0];
        }

        if (!searchResult) return { content: "no searchresults found" };

        const song = new Song(searchResult, msg.user);

        if (!song) throw "no song object";

        if (song.duration > 3600) return { content: "Cant play songs that are over an hour long." };

        let subscription = client.musicService.get(member.guild.id);

        if (subscription && subscription.voiceConnection.state.status === VoiceConnectionStatus.Destroyed) subscription = undefined;


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

        try {
            await entersState(subscription.voiceConnection, VoiceConnectionStatus.Ready, 20e3);
        } catch (e) {
            console.warn(e);
            return { content: "Failed to join vc" };
        }

        subscription.addToQueue(song);

        const embed = new MessageEmbed()
            .setThumbnail(song.thumbnail)
            .setTitle(subscription.getQueue().length < 1 ? `Now playing` : "Song queued")
            .setDescription(`[${song.title}](${song.url})`)
            .setColor(5362138)
            .setFooter(`${msg.user.username} <@${msg.user.id}>`, msg.user.displayAvatarURL())
            .setTimestamp();

        return { embeds: [embed] };
    }
};