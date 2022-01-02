import { GuildMember, HexColorString, MessageEmbed, Util } from "discord.js";
import { argumentType } from "../../types/argument";
import { Command, returnMessage } from "../../types/Command";
import RavenInteraction from "../../types/interaction";
import RavenClient from "../../types/ravenClient";
import { DiscordGatewayAdapterCreator, entersState, joinVoiceChannel, VoiceConnectionStatus } from "@discordjs/voice";
import Song from "../../types/song";
import musicService from "../../modules/music.service";
import * as play from "play-dl";
import { isDJ } from "../../lib/functions.service";
import moment from "moment";
import { CommandGroup } from "../../types/commandGroup";

module.exports = class extends Command {
    constructor() {
        super({
            name: "play",
            description: "Plays a song",
            group: CommandGroup.music,

            guildOnly: true,
            premium: true,

            args: [
                {
                    type: argumentType.string,
                    name: "song",
                    description: "song name or url",
                    required: true,
                },
                {
                    type: argumentType.boolean,
                    name: "force",
                    description: "force play?",
                    required: false,
                },
            ],

            throttling: {
                duration: 30,
                usages: 3,
            },
        });
    }

    async execute(msg: RavenInteraction): Promise<returnMessage> {
        const member = msg.member as GuildMember;
        const vc = member.voice.channel;
        const client = msg.client as RavenClient;

        const searchQuery = msg.options.getString("song", true);
        const force = msg.options.getBoolean("force");

        let subscription = client.musicService.get(member.guild.id);
        if (subscription && subscription.destroyed) subscription = undefined;
        const dj = isDJ(member);

        const failEmbed = new MessageEmbed()
            .setColor(process.env.EMBED_FAIL_COLOR as HexColorString);

        if (vc === null && !(dj && subscription)) { return { embeds: [failEmbed.setDescription("Join a voicechannel first.")] }; }

        if (subscription && vc?.id !== subscription.voiceConnection.joinConfig.channelId && !(dj && force)) {
            return { embeds: [failEmbed.setDescription("Join the same vc as the bot first.")] };
        }

        let searchResult: play.YouTubeVideo;

        if (searchQuery.startsWith("https") && play.yt_validate(searchQuery) === "video") {
            searchResult = await (await play.video_info(searchQuery)).video_details;
        } else {
            searchResult = (await play.search(searchQuery, { source: { youtube: "video" }, limit: 1, fuzzy: true }))[0];
        }

        if (!searchResult) return { embeds: [failEmbed.setDescription("no searchresults found")] };

        const song = new Song(searchResult, msg.user);

        if (!song) throw "no song object";

        if (song.duration.seconds > 3600 && !dj) return { embeds: [failEmbed.setDescription("Cant play songs that are over an hour long.")] };

        if (subscription && subscription.voiceConnection.state.status === VoiceConnectionStatus.Destroyed) subscription = undefined;

        if (!subscription) {

            if (!vc) throw `no vc in play command, unforseen logic error?, ${member.id}`;
            if (!vc.joinable) return { embeds: [failEmbed.setDescription("I cant join that vc")] };

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
            subscription.stop();
            return { embeds: [failEmbed.setDescription("Failed to join vc")] };
        }

        subscription.addToQueue(song);

        const queueLength = subscription.getQueue().length;

        const embed = new MessageEmbed()
            .setThumbnail(song.thumbnail)
            .setTitle(queueLength < 1 ? `Now playing` : "Song queued")
            .setDescription(`[${Util.escapeMarkdown(song.title).replace(/[()[\]]/g, "")}](${song.url})
            ${queueLength < 1 ? "" : `*Time untill play: ${moment().startOf("day").seconds(subscription.queueLength() - song.duration.seconds).format("H:mm:ss")}*`}`)
            .setColor(process.env.EMBED_COLOR as HexColorString);

        return { embeds: [embed] };
    }
};