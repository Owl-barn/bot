import { GuildMember, HexColorString, MessageEmbed } from "discord.js";
import { argumentType } from "../../types/argument";
import { Command, returnMessage } from "../../types/Command";
import { CommandGroup } from "../../types/commandGroup";
import RavenInteraction from "../../types/interaction";
import Genius from "genius-lyrics";
const genius = new Genius.Client(process.env.GENIUS_TOKEN);


module.exports = class extends Command {
    constructor() {
        super({
            name: "lyrics",
            description: "search song lyrics",
            group: CommandGroup.music,

            guildOnly: true,
            premium: true,

            args: [
                {
                    name: "song_name",
                    type: argumentType.string,
                    description: "Search for song lyrics",
                    required: false,
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
        let songName = msg.options.getString("song_name");

        const failEmbed = new MessageEmbed()
            .setColor(process.env.EMBED_FAIL_COLOR as HexColorString);

        const subscription = msg.client.musicService.get(member.guild.id);

        let oldName = songName;

        if (subscription && !subscription.destroyed && !songName) {
            const current = subscription.getCurrent();
            if (current) {
                songName = current.title.original;
                oldName = songName;
                // regex written by luksab
                songName = songName.replace(/[.\-()[\]{}|]/gi, " ");
                songName = songName.replace(/(:?^|\s)(:?official)|(:?video)|(:?music)|(:?lyrics?)|(:?acoustic)|(:?cover)|(:?hd)|(:?audio)|(:?VR 360)(:?$|\s)/gi, "");
            }
        }

        if (!songName) return { embeds: [failEmbed.setDescription("Please enter a song name")] };

        await msg.deferReply();

        const song = await genius.songs.search(songName).catch(() => null).then((x) => x ? x[0] : null);

        if (!song) return { embeds: [failEmbed.setDescription(`Could not find lyrics for \`${oldName}\`${songName !== oldName ? ` or \`${songName}\`` : ""}.`)] };
        let lyrics = await song.lyrics();
        lyrics = lyrics.replace(/^\[[^\]]+\]$/gm, "");

        lyrics = lyrics.replace(/\n\n/g, "\n");

        if (lyrics.length > 3000) {
            lyrics = lyrics.substring(0, 3000).trim() + "...";
        }

        const embed = new MessageEmbed()
            .setTitle(`Lyrics for **${song.title}**`)
            .setDescription(`${lyrics || "no lyrics found"}`)
            .setThumbnail(song.thumbnail || "")
            .addField("Song", `[${song.title}](${song.url})`, true)
            .addField("Artist", `[${song.artist.name}](${song.artist.url})`, true)
            .setColor(process.env.EMBED_COLOR as HexColorString);

        if (song.album) {
            embed.addField("Album", `[${song.album.name}](${song.album.url})`, true);
        }

        if (song.releasedAt) {
            embed.addField("Release", `<t:${Number(song.releasedAt) / 1000}>`, true);
        }

        return { embeds: [embed] };
    }
};
