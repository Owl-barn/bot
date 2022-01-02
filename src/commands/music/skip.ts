import { GuildMember, HexColorString, MessageActionRow, MessageButton, MessageComponentInteraction, MessageEmbed } from "discord.js";
import { isDJ } from "../../lib/functions.service";
import musicService from "../../modules/music.service";
import { argumentType } from "../../types/argument";
import { Command, returnMessage } from "../../types/Command";
import { CommandGroup } from "../../types/commandGroup";
import RavenInteraction from "../../types/interaction";


module.exports = class extends Command {
    constructor() {
        super({
            name: "skip",
            description: "skips a song",
            group: CommandGroup.music,

            guildOnly: true,
            premium: true,

            args: [
                {
                    type: argumentType.integer,
                    name: "index",
                    description: "which song to skip",
                    required: false,
                },
                {
                    type: argumentType.boolean,
                    name: "force",
                    description: "force skip?",
                    required: false,
                },
            ],

            throttling: {
                duration: 30,
                usages: 2,
            },
        });
    }

    public execute = async (msg: RavenInteraction): Promise<returnMessage> => {
        const member = msg.member as GuildMember;
        const vc = member.voice.channel;

        const index = msg.options.getInteger("index");
        const force = msg.options.getBoolean("force");

        const dj = isDJ(member);

        const failEmbed = new MessageEmbed()
            .setColor(process.env.EMBED_FAIL_COLOR as HexColorString);

        if (vc === null) return { embeds: [failEmbed.setDescription("Join a voicechannel first.")] };

        const subscription = msg.client.musicService.get(member.guild.id);

        const currentSong = subscription?.getCurrent();

        if (!subscription || subscription.destroyed || !currentSong) return { embeds: [failEmbed.setDescription("No music is playing")] };

        const voteLock = subscription.getVoteLock();

        const isRequester = currentSong.user.id == msg.user.id;

        if (voteLock && !(dj || isRequester)) return { embeds: [failEmbed.setDescription("Vote already in progress.")] };

        if (index) {
            const queue = subscription.getQueue();
            if (queue.length <= index - 1) return { embeds: [failEmbed.setDescription("Out of range.")] };
            if (queue[index - 1].user.id === msg.user.id || (dj && force)) {
                return this.skip(subscription, index);
            }

            return { embeds: [failEmbed.setDescription("Can't index skip a song you didnt add.")] };
        }

        if ((dj && force) || vc.members.size <= 3 || isRequester) return this.skip(subscription);


        const component = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId("vote")
                    .setLabel("vote skip")
                    .setStyle("PRIMARY"),
            );


        const embed = new MessageEmbed()
            .setDescription(`0/${Math.ceil((vc.members.size - 1) / 2)}`)
            .setColor(process.env.EMBED_COLOR as HexColorString);

        return { embeds: [embed], components: [component], callback: this.callback };
    }

    public callback = async (interaction: RavenInteraction) => {
        const filter = (i: MessageComponentInteraction) => i.customId === "vote";
        const collector = interaction.channel?.createMessageComponentCollector({ filter, time: 120000 });

        const voted: string[] = [];

        const subscription = interaction.client.musicService.get((interaction.member as GuildMember).guild.id);

        if (!subscription) return;

        const song = subscription.getCurrent()?.url;

        if (!song) return;

        subscription.setVoteLock(song);

        collector?.on("collect", async (x) => {
            try {
                if (x.customId !== "vote") return;

                const failEmbed = new MessageEmbed()
                    .setColor(process.env.EMBED_FAIL_COLOR as HexColorString);

                if (song !== subscription.getVoteLock()) {
                    return x.update({ embeds: [failEmbed.setDescription("song ended")], components: [] });
                }


                // Check if didnt vote yet.
                if (voted.some(y => y === x.user.id)) {
                    return x.reply({ embeds: [failEmbed.setDescription("You already voted")], ephemeral: true });
                }


                // Check if in vc.
                const vc = (x.member as GuildMember).voice.channel;
                if (!vc || !vc.members.some(y => y.id == x.client.user?.id)) {
                    return x.reply({ embeds: [failEmbed.setDescription("You arent in vc.")], ephemeral: true });
                }


                voted.push(x.user.id);

                // Get numbers.
                const current = Number(x.message.content.split("/")[0]) + 1;
                const max = (x.member as GuildMember).voice.channel?.members.size as number - 1;
                const half = Math.ceil(max / 2);

                console.log(`${x.user.username} voted to skip, now at ${current} was at ${current - 1}`);

                if (current >= half) {
                    x.update(this.skip(subscription));

                    return;
                }

                x.update({ embeds: [failEmbed.setDescription(`${current} /${half}`)] }).catch(console.error);
            } catch (e) {
                console.error(e);
            }
        });

        collector?.once("end", () => {
            // reset votelock if still set.
            if (subscription.getVoteLock() !== song) return;
            subscription.setVoteLock("");
        });
    }

    private skip = (subscription: musicService, index?: number | null): returnMessage => {


        const failEmbed = new MessageEmbed()
            .setDescription(`Out of range`)
            .setColor(process.env.EMBED_FAIL_COLOR as HexColorString);

        const queue = subscription.getQueue();
        if (!index) subscription.player.stop();
        else if (index > queue.length) return { embeds: [failEmbed] };
        else subscription.skipIndex(index);

        const embed = new MessageEmbed()
            .setDescription("Song skipped!")
            .setColor(process.env.EMBED_COLOR as HexColorString);

        return { embeds: [embed], components: [] };
    }
};